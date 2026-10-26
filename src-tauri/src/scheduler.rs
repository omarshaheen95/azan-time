//! The background engine (Afnon's PrayerWatch). The window computes the prayer times and sends a schedule of
//! events with their text already in the user's language; this thread checks it every few seconds, whether the
//! window is open, hidden or never shown, and fires each event once.
//!
//! Checking the clock against the schedule (rather than sleeping until the next event) is what makes sleep and
//! hibernation safe: after waking, an adhan more than two minutes late is skipped (Reminders.CALL_WINDOW_MS), and a
//! reminder whose prayer has begun is dropped.

use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::mpsc::Sender;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};

use crate::audio::Cmd;
use crate::{notify, tray};

const CHECK: Duration = Duration::from_secs(5);
/** Ask the window for more days once fewer than this many are left. */
const REFILL_MS: i64 = 7 * 86_400_000;

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Event {
    /// "kind:prayer:epoch", saved once fired so it never fires twice (also across restarts).
    pub key: String,
    /// "remind", "adhan" or "announce".
    pub kind: String,
    pub at: i64,
    /// Not fired at or after this moment.
    pub until: i64,
    pub title: String,
    pub body: String,
    /// "res:adhan/x.mp3" (bundled) or an absolute path; none for a silent event.
    pub sound: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Label {
    pub at: i64,
    pub text: String,
}

#[derive(Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Texts {
    pub open: String,
    pub stop: String,
    pub dismiss: String,
    pub skip: String,
    pub pause: String,
    pub quit: String,
}

#[derive(Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Schedule {
    pub events: Vec<Event>,
    /// The tray's "Next: Asr 3:14 PM", one per prayer, in time order.
    pub labels: Vec<Label>,
    pub texts: Texts,
    pub volume: f32,
    pub quiet_in_presentation: bool,
    /// The last moment the schedule covers.
    pub horizon: i64,
    pub rtl: bool,
}

#[derive(Default)]
pub struct State {
    pub schedule: Schedule,
    /// Fired event keys and their times (pruned after two days).
    pub done: HashMap<String, i64>,
    pub skip_next_adhan: bool,
    pub reminders_paused_until: i64,
    last_label: String,
    last_refill_ask: i64,
}

pub type Shared = Arc<Mutex<State>>;

pub fn now_ms() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as i64).unwrap_or(0)
}

fn data_file(app: &AppHandle, name: &str) -> Option<PathBuf> {
    let dir = app.path().app_data_dir().ok()?;
    fs::create_dir_all(&dir).ok()?;
    Some(dir.join(name))
}

pub fn load(app: &AppHandle) -> State {
    let mut s = State::default();
    if let Some(p) = data_file(app, "schedule.json") {
        if let Ok(text) = fs::read_to_string(p) {
            s.schedule = serde_json::from_str(&text).unwrap_or_default();
        }
    }
    if let Some(p) = data_file(app, "done.json") {
        if let Ok(text) = fs::read_to_string(p) {
            s.done = serde_json::from_str(&text).unwrap_or_default();
        }
    }
    s
}

pub fn save_schedule(app: &AppHandle, schedule: &Schedule) {
    if let (Some(p), Ok(text)) = (data_file(app, "schedule.json"), serde_json::to_string(schedule)) {
        let _ = fs::write(p, text);
    }
}

fn save_done(app: &AppHandle, done: &HashMap<String, i64>) {
    if let (Some(p), Ok(text)) = (data_file(app, "done.json"), serde_json::to_string(done)) {
        let _ = fs::write(p, text);
    }
}

/** A sound string from the window as a file path: bundled ("res:…") or the user's own file. */
pub fn resolve_sound(app: &AppHandle, sound: &str) -> Option<PathBuf> {
    match sound.strip_prefix("res:") {
        Some(rel) => app.path().resolve(rel, tauri::path::BaseDirectory::Resource).ok(),
        None => Some(PathBuf::from(sound)),
    }
}

pub fn spawn(app: AppHandle, state: Shared, audio: Sender<Cmd>) {
    thread::Builder::new()
        .name("scheduler".into())
        .spawn(move || loop {
            check(&app, &state, &audio);
            thread::sleep(CHECK);
        })
        .expect("scheduler thread");
}

fn check(app: &AppHandle, state: &Shared, audio: &Sender<Cmd>) {
    let now = now_ms();
    let mut due: Vec<Event> = Vec::new();
    let (label, schedule) = {
        let mut s = state.lock().unwrap();
        for e in &s.schedule.events {
            if e.at <= now && now < e.until && !s.done.contains_key(&e.key) {
                due.push(e.clone());
            }
        }
        // Mark them now, so a slow notification never lets the next check fire them again.
        let mut changed = false;
        for e in &due {
            s.done.insert(e.key.clone(), e.at);
            changed = true;
        }
        let before = s.done.len();
        s.done.retain(|_, at| now - *at < 2 * 86_400_000);
        if changed || s.done.len() != before {
            save_done(app, &s.done);
        }

        if s.schedule.horizon - now < REFILL_MS && now - s.last_refill_ask > 3_600_000 {
            s.last_refill_ask = now;
            let _ = app.emit("need-schedule", ());
        }

        let label = s.schedule.labels.iter().find(|l| l.at > now).map(|l| l.text.clone()).unwrap_or_default();
        let changed_label = label != s.last_label;
        s.last_label = label.clone();
        (changed_label.then_some(label), s.schedule.clone())
    };
    if let Some(label) = label {
        tray::set_label(app, &label);
    }

    // Events due within the last two minutes all fire (two reminders may share a minute). Older ones were missed
    // while the PC slept: of those, only the latest of each kind, so waking up doesn't bring a pile of toasts.
    due.sort_by_key(|e| e.at);
    let (fresh, stale): (Vec<Event>, Vec<Event>) = due.into_iter().partition(|e| now - e.at < FRESH_MS);
    let mut latest: HashMap<String, Event> = HashMap::new();
    for e in stale {
        latest.insert(e.kind.clone(), e);
    }
    let mut firing: Vec<Event> = latest.into_values().chain(fresh).collect();
    // Sounds interrupt each other: the adhan goes last so it wins over a reminder or a spoken line in the same check.
    firing.sort_by_key(|e| (rank(&e.kind), e.at));
    for e in firing {
        fire(app, state, audio, &schedule, &e);
    }
}

const FRESH_MS: i64 = 120_000;

fn rank(kind: &str) -> u8 {
    match kind {
        "adhan" => 2,
        "announce" => 1,
        _ => 0,
    }
}

fn fire(app: &AppHandle, state: &Shared, audio: &Sender<Cmd>, schedule: &Schedule, e: &Event) {
    {
        let mut s = state.lock().unwrap();
        // "Pause reminders" covers every reminder (the extras and the iqama too), never the time of a prayer itself.
        if e.kind != "adhan" && e.kind != "announce" && s.reminders_paused_until > now_ms() {
            return;
        }
        if e.kind == "adhan" && s.skip_next_adhan {
            s.skip_next_adhan = false;
            drop(s);
            tray::refresh(app);
            return;
        }
    }
    let quiet = schedule.quiet_in_presentation && presenting();
    #[cfg(debug_assertions)]
    eprintln!("fire {} {} quiet={quiet} sound={:?}", e.kind, e.key, e.sound);
    // A spoken clip that was never recorded plays nothing; the toast then keeps its own sound.
    let sound = if quiet { None } else { e.sound.as_deref().and_then(|s| resolve_sound(app, s)).filter(|p| p.exists()) };
    if let Some(path) = &sound {
        let _ = audio.send(Cmd::Play(path.clone(), schedule.volume));
    }
    notify::show(app, e, &schedule.texts, sound.is_some(), audio.clone());
    let _ = app.emit("fired", e.clone());
}

/// A presentation, a full-screen game or video, or Windows' "busy" state.
#[cfg(windows)]
fn presenting() -> bool {
    use windows::Win32::UI::Shell::{
        SHQueryUserNotificationState, QUNS_BUSY, QUNS_PRESENTATION_MODE, QUNS_RUNNING_D3D_FULL_SCREEN,
    };
    match unsafe { SHQueryUserNotificationState() } {
        Ok(s) => s == QUNS_BUSY || s == QUNS_RUNNING_D3D_FULL_SCREEN || s == QUNS_PRESENTATION_MODE,
        Err(_) => false,
    }
}

#[cfg(not(windows))]
fn presenting() -> bool {
    false
}

/// `--test adhan|remind|announce`: fires the next event of that kind now (after a delay to switch apps), as
/// Afnon's `--es test call`.
pub fn test(app: &AppHandle, state: &Shared, audio: &Sender<Cmd>, kind: &str) {
    let now = now_ms();
    let schedule = state.lock().unwrap().schedule.clone();
    let next = schedule.events.iter().find(|e| e.kind == kind && e.at > now);
    #[cfg(debug_assertions)]
    eprintln!("test {kind}: {} events, next {:?}", schedule.events.len(), next.map(|e| &e.key));
    if let Some(e) = next {
        let mut e = e.clone();
        e.key = format!("test:{now}");
        fire(app, state, audio, &schedule, &e);
    }
}
