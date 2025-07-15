


# HTMLServe

**HTMLServe** is a lightweight macOS utility that lets you serve any local HTML file with a local HTTP server — simply by double-clicking the file.

## Features

- ✅ Automatically launches a local HTTP server when you open an `.html` file
- ✅ Opens your browser to `http://localhost:<port>` automatically
- ✅ Zero configuration needed
- ✅ Great for previewing local web projects that rely on JavaScript/JSON modules or XHR

## Installation

Download the `.dmg` release from the [Releases](https://github.com/colinhebe/htmlserve/releases) page, drag `HTMLServe` to your Applications folder, and set it as the default app for `.html` files.

## Usage

Double-click any `.html` file — HTMLServe will:

1. Start an HTTP server in the file's directory
2. Open your browser to that file via `http://localhost:PORT/filename.html`

This avoids browser restrictions like CORS or `file://` limitations.

## Platform Support

- 🖥 macOS — currently supported
- 🪟 Windows — coming soon

## TODO

- [ ] Support notarization for macOS distribution
- [ ] Enable drag-and-drop of .html files onto the app icon to open and serve

## License

MIT
