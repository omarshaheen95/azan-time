# Azan Time · وقت الأذان

Prayer times, the adhan and reminders for Windows, running in the tray when the window is closed. Offline
calculation (adhan-js), checked against six Latin American mosques' tables; search across 39,102 places (GeoNames);
adhkar, Al-Kahf, Duha, night, Sunnah-fast, iqama and custom reminders; Arabic (RTL), English, Spanish and Portuguese;
signed updates from GitHub releases. Based on [Afnon](https://github.com/egyjs/afnon-android-tv-launcher) (MIT). The full plan, decisions and
implementation log are in [PLAN.md](PLAN.md) (Arabic).

## Requirements

Node 20+, Rust (stable-msvc), Visual Studio Build Tools with the C++ workload, WebView2 (built into Windows 10/11).

## Develop

```bash
npm install
npm test              # calculation, mosque-table, reminder tests (through tsx)
npx tauri dev         # the app, with live reload of the window
npm run dev           # the window only, in a browser (no engine; settings in localStorage)
```

Rust builds go to `C:/Users/Ahmed/AppData/Local/azan-time-target` (`src-tauri/.cargo/config.toml`): a deep project
folder pushes the linker past Windows' 260-character path limit. Change it per machine.

### Trying things without waiting for a prayer

Fires the next event of that kind eight seconds after start (quit any running copy first: the app is single-instance):

```bash
azan-time.exe --hidden --test remind     # reminder toast and spoken line
azan-time.exe --hidden --test adhan      # the adhan toast with Stop, and the adhan
azan-time.exe --hidden --test announce   # "it is now time for …" (needs a prayer whose adhan is off)
```

## Release

GitHub Actions: `ci.yml` on every push, `release.yml` on a `v*` tag (draft release with the installer, its update
signature and `latest.json`). Secrets, the update key and code-signing options: [docs/RELEASING.md](docs/RELEASING.md).

## Build the installer locally

```bash
npx tauri build       # → <target-dir>/release/bundle/nsis/Azan Time_<version>_x64-setup.exe
# with TAURI_SIGNING_PRIVATE_KEY(_PASSWORD) set (docs/RELEASING.md) it also writes the update's .sig
```

## Layout

```
src/lib/prayer.ts      calculation (Afnon's PrayerDay), city time zone, high-latitude fix for the south
src/lib/cities.ts      Afnon's cities + Latin America, with time zones
src/lib/schedule.ts    30 days of reminders, adhans and announcements for the engine
src/lib/extras.ts      adhkar, Al-Kahf, Duha, night, fasts, iqama, own reminders
src/lib/places.ts      city search (places.json from tools/geonames.py) and per-country defaults
src/lib/updates.ts     daily update check, install on the user's click
src/lib/settings.ts    settings and defaults (saved as JSON in %APPDATA%\app.azantime.desktop)
src/i18n/              ar / en / es / pt
src/screens/           home, today (Qibla), settings, about
src-tauri/src/         scheduler (the background check), audio, notify (toasts), tray
src-tauri/resources/   adhan recordings (Wikimedia Commons, see THIRD_PARTY.md) and spoken clips
tools/announce.py      records the spoken clips with edge-tts
.github/workflows/     CI and the release build (docs/RELEASING.md)
```
