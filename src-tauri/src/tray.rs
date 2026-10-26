//! The tray icon: the next prayer in its tooltip and at the top of its menu, and the controls that matter while the
//! window is closed. Its words come with the schedule, in the user's language.

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, Wry};

use crate::audio::Cmd;
use crate::scheduler::now_ms;
use crate::Engine;

const ID: &str = "main";

pub fn create(app: &AppHandle) -> tauri::Result<()> {
    let menu = build_menu(app)?;
    TrayIconBuilder::with_id(ID)
        .icon(app.default_window_icon().cloned().expect("app icon"))
        .tooltip(app.config().product_name.clone().unwrap_or_default())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| on_menu(app, event.id.as_ref()))
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                crate::show_main(tray.app_handle());
            }
        })
        .build(app)?;
    Ok(())
}

fn build_menu(app: &AppHandle) -> tauri::Result<Menu<Wry>> {
    let engine = app.state::<Engine>();
    let (texts, label, skip, paused) = {
        let s = engine.state.lock().unwrap();
        let now = now_ms();
        let label = s.schedule.labels.iter().find(|l| l.at > now).map(|l| l.text.clone()).unwrap_or_default();
        (s.schedule.texts.clone(), label, s.skip_next_adhan, s.reminders_paused_until > now)
    };
    let or = |s: &str, fallback: &str| if s.is_empty() { fallback.to_string() } else { s.to_string() };
    let check = |on: bool, s: String| if on { format!("✓ {s}") } else { s };
    let next = MenuItem::with_id(app, "next", or(&label, "Azan Time"), false, None::<&str>)?;
    let open = MenuItem::with_id(app, "open", or(&texts.open, "Open"), true, None::<&str>)?;
    let stop = MenuItem::with_id(app, "stop", or(&texts.stop, "Stop adhan"), true, None::<&str>)?;
    let skip = MenuItem::with_id(app, "skip", check(skip, or(&texts.skip, "Skip the next adhan")), true, None::<&str>)?;
    let pause = MenuItem::with_id(app, "pause", check(paused, or(&texts.pause, "Pause reminders for 1 hour")), true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", or(&texts.quit, "Quit"), true, None::<&str>)?;
    let sep = || PredefinedMenuItem::separator(app);
    Menu::with_items(app, &[&next, &sep()?, &open, &stop, &skip, &pause, &sep()?, &quit])
}

fn on_menu(app: &AppHandle, id: &str) {
    let engine = app.state::<Engine>();
    match id {
        "open" => crate::show_main(app),
        "stop" => {
            let _ = engine.audio.send(Cmd::Stop);
        }
        "skip" => {
            let mut s = engine.state.lock().unwrap();
            s.skip_next_adhan = !s.skip_next_adhan;
        }
        "pause" => {
            let mut s = engine.state.lock().unwrap();
            let now = now_ms();
            s.reminders_paused_until = if s.reminders_paused_until > now { 0 } else { now + 3_600_000 };
        }
        "quit" => {
            let _ = engine.audio.send(Cmd::Stop);
            app.exit(0);
        }
        _ => {}
    }
    refresh(app);
}

/// Rebuilds the menu (new language, a toggled item).
pub fn refresh(app: &AppHandle) {
    if let (Some(tray), Ok(menu)) = (app.tray_by_id(ID), build_menu(app)) {
        let _ = tray.set_menu(Some(menu));
    }
}

/// The next prayer, in the tooltip and the menu's first line.
pub fn set_label(app: &AppHandle, label: &str) {
    if let Some(tray) = app.tray_by_id(ID) {
        let _ = tray.set_tooltip(Some(label));
    }
    refresh(app);
}
