## Pipe Inventory

Inventory Management System for Pipe Products — Electron-based desktop application for businesses selling and tracking pipe and related hardware.

Version: 1.4.0

---

## Table of contents

- About
- Key features
- Tech stack
- Quick start
- Development
- Building distributables
- Project structure
- Contributing
- License
- Contact

## About

Pipe Inventory is a cross-platform Electron application designed to help small-to-medium hardware businesses manage inventory, sales, backups and reports for pipe products and related items. It includes packaging for Windows (portable & installer), macOS, and Linux, plus helpers for building and creating installer artifacts.

This repository contains the full application source, build tooling and packaging configuration.

## Key features

- Inventory tracking and sorting optimized for pipe and hardware products
- Sales and reporting (PDF export and printable reports)
- Local persistence (SQLite / electron-store backups) and export (`.pib` backup files)
- Build scripts to produce Windows portable, NSIS installers, macOS DMG and Linux AppImage/deb/rpm
- Simple UI powered by Bootstrap, Chart.js and Recharts for visuals
- Packaging support via `electron-builder` and helper scripts for platform details

## Tech stack

- Electron
- Node.js
- SQLite (via `sqlite3`) for local data storage
- Bootstrap 5, jQuery for UI
- Chart.js and Recharts for charts/graphs
- Electron Builder for creating native installers

## Quick start (developer)

Prerequisites:

- Node 18+ (or compatible LTS), npm
- On macOS and Windows: native build toolchains for `electron-builder` (see project scripts)

Install dependencies:

```bash
cd /path/to/pipe-inventory-app
npm install
```

Run the app in development mode:

```bash
npm run dev
```

Run setup helpers (icon generation, entitlements, etc):

```bash
npm run setup
```

## Building distributables

The project includes a set of npm scripts that wrap the build flow.

- Build for all targets (mac/linux/win):

```bash
npm run build:all
```

- macOS only:

```bash
npm run build:mac
```

- Windows portable (single-file portable exe):

```bash
npm run build:win-portable
```

- Windows (installer/NSIS):

```bash
npm run build:win
```

- Linux (AppImage, deb, rpm, snap):

```bash
npm run build:linux
```

Note: `npm run setup` or the `postinstall` hook runs native dependency setup required by `electron-builder`.

## Project structure (high level)

- `src/` — application source (UI, app logic)
- `public/` — static assets and images
- `build/` — build scripts, icons, entitlements, and resources used by the packager
- `mobile/` — related Capacitor/mobile build files (mobile support)
- `pipe-flow-mobile-inventory-main/` — related project copy/variants and build helpers
- `win-resources/` — Windows specific resources
- `package.json` — scripts and dependency manifest

For a more detailed set of notes about fixes and packaging, see the many `*_SUMMARY.md` and `WINDOWS_*.md` documents in the repo.

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make changes and add tests where appropriate
4. Commit and open a pull request describing the change

If you want me to set up CI (GitHub Actions) or release automation, tell me which distribution channel you'd like (GitHub Releases, private server, S3, etc.) and I can add workflow files.

## License

This project currently declares the ISC license in `package.json`. If you want a different license, update `package.json` and `LICENSE` accordingly.

## Contact / Maintainer notes

This repository contains many helper and build scripts for packaging on different host OSes. If you need help setting up signing (macOS hardened runtime / Notary, Windows code signing) or configuring automatic releases, provide the signing certificates and I can help wire them into the build.

---
