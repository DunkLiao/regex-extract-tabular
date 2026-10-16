# Repository Guidelines

## Project Structure & Module Organization

This repository packages an offline regex extraction app as a Windows desktop application with Tauri. The frontend lives in `web/`: `index.html` defines the interface, `app.js` handles UI behavior, `regex-worker.js` runs regex work off the main thread, `styles.css` contains styling, and `icon.svg` is the web icon. The Rust/Tauri host is in `src-tauri/`; `src-tauri/src/main.rs` and `lib.rs` provide the application entry points, `tauri.conf.json` configures Tauri, `capabilities/` holds permissions, and `icons/` contains platform assets. There is no separate test directory currently.

## Build, Test, and Development Commands

Run commands from the repository root after installing Node.js/npm and Rust with the Tauri prerequisites:

- `npm install` installs the Tauri CLI dependency.
- `npm run dev` starts the Tauri development application.
- `npm run check` runs `cargo check` against the Rust host.
- `npm test` runs Rust tests via Cargo.
- `npm run build` produces an unbundled release executable under `src-tauri/target/release/`.
- `build.bat` is a Windows convenience wrapper for the release build.

## Coding Style & Naming Conventions

Use four spaces for JavaScript, HTML, CSS, and Rust indentation. Keep browser-side logic in `web/` and host integration in `src-tauri/`; avoid adding a framework or build pipeline unless the project needs it. Use descriptive kebab-case filenames for web assets, camelCase for JavaScript functions and variables, and Rust's standard `snake_case` for functions and modules. No formatter or linter is configured; keep changes focused and consistent with nearby code.

## Testing Guidelines

Rust tests belong alongside their implementation or in module test blocks and should use descriptive names. Run `npm test` after Rust changes and `npm run check` for a compile check. For frontend changes, run `npm run dev` and manually verify the affected workflow in the desktop window, including offline behavior when relevant. No coverage threshold is configured.

## Commit & Pull Request Guidelines

This checkout has no Git history available to establish a commit convention. Use short, imperative commit subjects such as `Fix regex worker error handling`. Pull requests should explain the user-visible change, list relevant verification commands and results, link related issues when available, and include screenshots for visible UI changes. Note any changes to Tauri permissions, configuration, or platform assets.

## Security & Configuration Tips

The application is designed to work offline. Keep regex processing local and avoid introducing network calls or collecting input data. Review `src-tauri/capabilities/default.json` whenever changing frontend access to native APIs, and do not commit secrets or generated build output.
