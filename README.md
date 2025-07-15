# HTMLServe

A lightweight HTML file server built with Node.js.

## Architecture

### 1. Core Logic (cli.js)
- Pure Node.js implementation
- Uses Express to provide HTTP service
- Automatic port allocation
- Browser auto-open
- Graceful shutdown handling

### 2. Packaging Solution (pkg)
- Generates standalone executable files
- No Node.js runtime required
- Supports Intel and Apple Silicon
- File size about 50MB

### 3. App Wrapping (AppleScript)
- AppleScript-based macOS .app bundle
- Supports file associations
- Drag-and-drop file support
- Double-click to open support
- Auto-exit when HTML page is closed

## Build Steps

### 1. Install Dependencies
```bash
npm install
npm install -g pkg  # Install pkg globally
```

### 2. Test CLI Version
```bash
# Test Node.js version
npm run cli test.html

# Or run directly
node cli.js test.html
```

### 3. Build App Bundle
```bash
./build-simple-app.sh
```

This will create `dist/HTMLServe.app` (AppleScript-based)

### 4. Install the Application
```bash
# Copy to Applications folder
cp -r dist/HTMLServe.app /Applications/

# Or manually drag to the Applications folder
```

### 5. Set File Associations

#### Method 1: Graphical Interface
1. Right-click any .html file
2. Select "Open With" > "Other..."
3. Choose HTMLServe.app
4. Check "Always open with this application"

#### Method 2: Command Line
```bash
# Set default application
duti -s com.lvjiaxi.htmlserve public.html all
```

## Usage

### CLI Usage
```bash
# Use the executable directly
./dist/htmlserve test.html

# Show help
./dist/htmlserve --help

# Show version
./dist/htmlserve --version
```

### App Usage
1. **Double-click .html files**: Automatically open with HTMLServe
2. **Drag files onto the App**: Supports dragging onto app icon
3. **Right-click menu**: Choose HTMLServe in "Open With"
4. **Auto-exit**: App automatically closes when HTML page is closed

## Features

- **Lightweight**: ~50MB standalone executable
- **Fast Startup**: Quick launch and responsive
- **Low Memory Usage**: Efficient resource consumption
- **File Association**: Built-in macOS file association support
- **Auto-exit**: Automatically closes when HTML page is closed
- **Drag & Drop**: Supports dragging files onto app icon
- **Cross-platform CLI**: Works on all platforms via command line

## File Structure

```
├── cli.js                 # Core CLI logic
├── HTMLServe.applescript  # AppleScript for file handling
├── build-simple-app.sh    # Build script
├── index.html             # Test file
└── dist/
    ├── htmlserve          # Universal binary file
    └── HTMLServe.app/     # macOS App Bundle
```

## Troubleshooting

### 1. Permission Issues
```bash
# Grant execute permission
chmod +x dist/htmlserve
```

### 2. Security Warnings
On macOS, the first run might require allowing execution in "System Preferences" > "Security & Privacy".

### 3. File Association Failure
```bash
# Re-register file types
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f /Applications/HTMLServe.app
```

### 4. View Logs
```bash
# View App runtime logs
tail -f ~/Library/Logs/HTMLServe.log
```

## Further Optimization

1. **Icon Optimization**: Convert PNG to .icns format
2. **Code Signing**: Add developer signature to avoid security warnings
3. **Notification Center**: Add startup/shutdown notifications
4. **Menu Bar Integration**: Optional menu bar status indicator
