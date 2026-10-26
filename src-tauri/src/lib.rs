//! Azan Time's native side: the window lives in the tray, and the scheduler, the player and the notifications keep
//! running whether the window is open or closed (PLAN.md §4).

mod audio;
mod notify;
mod scheduler;
mod tray;

use std::fs;
use std::sync::mpsc::Sender;
use std::sync::{Arc, Mutex};

use tauri::{AppHandle, Manager, WindowEvent};
use tauri_plugin_autostart::MacosLauncher;

use scheduler::{Schedule, Shared};

/// Launched at Windows sign-in with this flag (autostart), the app starts in the tray without a window.
const HIDDEN_ARG: &str = "--hidden";

pub struct Engine {
    pub state: Shared,
    pub audio: Sender<audio::Cmd>,
}

/// The window, made here rather than from the config at start-up. After a crash, the old copy's WebView2 processes can
/// hold its data folder ("The requested resource is in use", 0x800700AA), and a window made from the config then
/// stopped the whole app, adhan included. So: the usual folder, then spare ones; and if none works, the app runs on
/// without a window (the engine has its saved 30-day schedule) and tries again when the window is asked for.
fn create_main(app: &AppHandle) -> bool {
    if app.get_webview_window("main").is_some() {
        return true;
    }
    let Some(config) = app.config().app.windows.iter().find(|w| w.label == "main").cloned() else {
        return false;
    };
    let spare = app.path().app_local_data_dir().ok();
    let folders = [None, spare.as_ref().map(|d| d.join("EBWebView-spare")), spare.as_ref().map(|d| d.join("EBWebView-spare2"))];
    for (attempt, folder) in folders.into_iter().enumerate() {
        let mut builder = match tauri::WebviewWindowBuilder::from_config(app, &config) {
            Ok(b) => b,
            Err(e) => {
                eprintln!("window: {e}");
                return false;
            }
        };
        if let Some(folder) = folder {
            builder = builder.data_directory(folder);
        }
        match builder.build() {
            Ok(_) => return true,
            Err(e) => eprintln!("window (attempt {}): {e}", attempt + 1),
        }
    }
    false
}

pub fn show_main(app: &AppHandle) {
    if !create_main(app) {
        return;
    }
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
    }
}

fn settings_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("settings.json"))
}

#[tauri::command]
fn load_settings(app: AppHandle) -> Option<serde_json::Value> {
    let text = fs::read_to_string(settings_path(&app).ok()?).ok()?;
    serde_json::from_str(&text).ok()
}

#[tauri::command]
fn save_settings(app: AppHandle, settings: serde_json::Value) -> Result<(), String> {
    let text = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(settings_path(&app)?, text).map_err(|e| e.to_string())
}

/// The window's computed schedule: replaces the old one; events already fired stay fired.
#[tauri::command]
fn set_schedule(app: AppHandle, engine: tauri::State<Engine>, schedule: Schedule) {
    scheduler::save_schedule(&app, &schedule);
    engine.state.lock().unwrap().schedule = schedule;
    tray::refresh(&app);
}

#[tauri::command]
fn play_sound(app: AppHandle, engine: tauri::State<Engine>, sound: String, volume: f32) -> Result<(), String> {
    let path = scheduler::resolve_sound(&app, &sound).ok_or("no such sound")?;
    if !path.exists() {
        return Err(format!("missing: {}", path.display()));
    }
    engine.audio.send(audio::Cmd::Play(path, volume)).map_err(|e| e.to_string())
}

/// A plain toast from the window (an update is available); clicking it opens the app.
#[tauri::command]
fn show_toast(app: AppHandle, engine: tauri::State<Engine>, title: String, body: String) {
    let texts = engine.state.lock().unwrap().schedule.texts.clone();
    let e = scheduler::Event { key: String::new(), kind: "info".into(), at: 0, until: 0, title, body, sound: None };
    notify::show(&app, &e, &texts, false, engine.audio.clone());
}

#[tauri::command]
fn stop_sound(engine: tauri::State<Engine>) {
    let _ = engine.audio.send(audio::Cmd::Stop);
}

/// "Add your own file": copies it into the app's folder, so moving or deleting the original keeps the adhan.
#[tauri::command]
fn import_sound(app: AppHandle, path: String) -> Result<String, String> {
    let src = std::path::PathBuf::from(&path);
    let name = src.file_name().ok_or("no file name")?;
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("sounds");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let dest = dir.join(name);
    fs::copy(&src, &dest).map_err(|e| e.to_string())?;
    Ok(dest.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // First: a second launch (the Start menu while it runs in the tray) shows the window instead.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| show_main(app)))
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec![HIDDEN_ARG])))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            load_settings, save_settings, set_schedule, play_sound, stop_sound, import_sound, show_toast
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            let state: Shared = Arc::new(Mutex::new(scheduler::load(&handle)));
            let audio = audio::spawn();
            app.manage(Engine { state: state.clone(), audio: audio.clone() });
            tray::create(&handle)?;
            // Hidden until shown; also loads the page, which computes the schedule.
            create_main(&handle);
            scheduler::spawn(handle.clone(), state.clone(), audio.clone());

            let args: Vec<String> = std::env::args().collect();
            if !args.iter().any(|a| a == HIDDEN_ARG) {
                show_main(&handle);
            }
            // --test adhan|remind|announce, eight seconds after start (time to switch to another app).
            if let Some(i) = args.iter().position(|a| a == "--test") {
                if let Some(kind) = args.get(i + 1).cloned() {
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_secs(8));
                        scheduler::test(&handle, &state, &audio, &kind);
                    });
                }
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            // Closing the window keeps the app in the tray; Quit is in the tray's menu.
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Azan Time");
}
