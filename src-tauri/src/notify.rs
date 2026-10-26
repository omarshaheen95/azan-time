//! Windows toast notifications, the side notification at prayer time (PLAN.md §3, decision 3). The toast is silent
//! when the app plays its own sound: Windows toasts can only play short system sounds, never a whole adhan.

use std::sync::mpsc::Sender;

use tauri::AppHandle;
use tauri_winrt_notification::{Duration, Scenario, Sound, Toast};

use crate::audio::Cmd;
use crate::scheduler::{Event, Texts};

/// Toasts are shown under an AppUserModelID that has a Start menu shortcut. The installer makes one for the app's
/// identifier; a development build has none, so it borrows PowerShell's (and its toasts stay apart from the
/// installed app's).
fn app_id(app: &AppHandle) -> String {
    if cfg!(debug_assertions) { Toast::POWERSHELL_APP_ID.to_string() } else { app.config().identifier.clone() }
}

pub fn show(app: &AppHandle, e: &Event, texts: &Texts, own_sound: bool, audio: Sender<Cmd>) {
    let adhan = e.kind == "adhan";
    let mut toast = Toast::new(&app_id(app))
        .title(&e.title)
        .text1(&e.body)
        .duration(if adhan { Duration::Long } else { Duration::Short })
        .sound(if own_sound { None } else { Some(Sound::Default) });
    if adhan {
        // Reminder: it stays on screen until answered, like a call, instead of sliding away under a long adhan.
        toast = toast.scenario(Scenario::Reminder).add_button(&texts.stop, "stop").add_button(&texts.dismiss, "dismiss");
    }
    let handle = app.clone();
    toast = toast.on_activated(move |action| {
        match action.as_deref() {
            Some("stop") => {
                let _ = audio.send(Cmd::Stop);
            }
            Some("dismiss") => {}
            // The toast's body: open the app.
            _ => crate::show_main(&handle),
        }
        Ok(())
    });
    match toast.show() {
        Err(err) => eprintln!("toast: {err}"),
        #[cfg(debug_assertions)]
        Ok(()) => eprintln!("toast shown: {}", e.title),
        #[cfg(not(debug_assertions))]
        Ok(()) => {}
    }
}
