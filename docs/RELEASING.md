# Releasing Azan Time

Releases are built by GitHub Actions (`.github/workflows/release.yml`) and published as GitHub releases. The app
checks the latest release's `latest.json` once a day (Settings → App, on by default) and offers the update; the user
installs it with one click (About, or the notice on Home). It never installs or restarts on its own.

## One-time setup

1. **The repository.** Replace `OWNER/azan-time` in `src-tauri/tauri.conf.json` → `plugins.updater.endpoints` with the
   real GitHub `owner/repo`. Releases must be public for the app to read `latest.json` (the repository can be private
   only if releases are published elsewhere).
2. **The update-signing key** (not the Authenticode certificate). It was generated on the maintainer's PC with
   `npx tauri signer generate` into `%USERPROFILE%\.tauri\azan-time.key` (password in `azan-time.key.password`); its
   public half is `plugins.updater.pubkey`. Add two repository secrets:
   - `TAURI_SIGNING_PRIVATE_KEY`: the contents of `azan-time.key`
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: the contents of `azan-time.key.password`

   **Back both files up.** Without the key, installed copies can never be updated again (they only accept updates
   signed with it). Never commit them.

## Each release

1. Set the version in `package.json`, `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml`.
2. Note the changes in `PLAN.md`'s implementation log.
3. `git tag v0.4.0 && git push origin v0.4.0` (or run the workflow by hand).
4. The workflow tests, records the spoken clips, builds and signs, and makes a **draft** release with the installer,
   its `.sig` and `latest.json`. Check it, then **Publish**: only then do installed copies see the update.

## Windows code signing (Authenticode)

Unsigned installers work, but SmartScreen shows "Windows protected your PC" until the download builds reputation.
The workflow signs when the repository **variable** `WINDOWS_SIGN_COMMAND` is set: tauri runs that command on the
program and on the installer (`%1` is the file) before computing the update signature, which is the order that keeps
updates valid. Signing after the build would break the `.sig`.

Options, as of October 2026:

| Option | Cost | For | Notes |
|---|---|---|---|
| [Azure Artifact (Trusted) Signing](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart) | $9.99/month | Organisations in ~12 countries; **individuals in the US and Canada only** | Best CI support (`trusted-signing-cli`), but not open to an individual elsewhere. |
| [SignPath Foundation](https://signpath.org/) | Free | Open-source projects (OSI licence, no proprietary parts) | The publisher shown is "SignPath Foundation". Signs in its own pipeline after the build, so the updater `.sig` must be made again from the signed installer. The edge-tts clips may not count as open content. |
| [Certum](https://shop.certum.eu/code-signing.html) Standard Code Signing (SimplySign cloud) | from about €49/year | Individuals, any country | Cloud key with a phone-app login, so signing is easiest on the maintainer's PC (`signtool` with SimplySign Desktop) rather than unattended in CI. |

**Recommended for an individual maintainer outside the US and Canada: Certum, signing releases locally.**
1. Build locally with `npx tauri build`, with `bundle.windows.signCommand` set to
   `signtool sign /fd sha256 /tr http://time.certum.pl /td sha256 /sha1 <thumbprint> %1`, while SimplySign Desktop is
   logged in.
2. Upload the installer, its `.sig` and a `latest.json` to the release.

If the project becomes an organisation in an eligible country, move to Azure, with `WINDOWS_SIGN_COMMAND` =
`trusted-signing-cli -e <endpoint> -a <account> -c <profile> -d "Azan Time" %1` and the three `AZURE_*` secrets.

## The machine-specific build folder

`src-tauri/.cargo/config.toml` (not committed) moves Rust's build output to a short path on the maintainer's PC: the
project folder is deep enough to push the linker past Windows' 260-character limit. CI doesn't need it.
