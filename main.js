let openFilePath = null;
const { app, BrowserWindow, dialog } = require("electron")
const express = require("express")
const getPort = require("get-port").default
const open = require("open").default
const path = require("path")
const fs = require("fs")

let server = null

app.setAsDefaultProtocolClient('html')

app.on("open-file", (event, filePath) => {
    event.preventDefault();
    console.log("[open-file] Received:", filePath);
    if (app.isReady()) {
        console.log("[open-file] App is ready, serving now.");
        serveAndOpen(filePath);
    } else {
        console.log("[open-file] App not ready yet, deferring.");
        openFilePath = filePath;
    }
});

app.whenReady().then(async () => {
    // if (process.platform === "darwin") {
    //     app.dock.setIcon(path.join(__dirname, "assets", "htmlserve-icon.png"));
    // }
    const args = process.argv.slice(1).filter((a) => a.endsWith(".html"));
    console.log("[app ready] argv:", process.argv);
    console.log("[app ready] args:", args);
    console.log("[app ready] openFilePath:", openFilePath);

    if (args.length > 0) {
        await serveAndOpen(args[0]);
    } else if (openFilePath) {
        await serveAndOpen(openFilePath);
    }

    const win = new BrowserWindow({
        show: false,
        icon: path.join(__dirname, "assets", "htmlserve-icon.png")
    });
});

async function serveAndOpen(filePath) {
    try {
        const absPath = path.resolve(filePath);
        const folder = path.dirname(absPath);
        const filename = path.basename(absPath);
        console.log("[serveAndOpen] Serving file:", absPath);

        const port = await getPort({ port: Array.from({ length: 1001 }, (_, i) => 8000 + i) });

        const expressApp = express();
        expressApp.use(express.static(folder));

        const htmlContent = fs.readFileSync(absPath, "utf8");
        const injected = htmlContent.replace(
            "</body>",
            `<script>
              window.addEventListener('unload', () => {
                navigator.sendBeacon('/__htmlserve_unload__');
              });
            </script></body>`
        );
        expressApp.get(`/${filename}`, (req, res) => {
            res.setHeader("Content-Type", "text/html");
            res.send(injected);
        });
        expressApp.post("/__htmlserve_unload__", (req, res) => {
            console.log("[HTML] unload triggered. Closing server...");
            res.sendStatus(200);
            server.close(() => {
                console.log("[HTMLServe] Server closed.");
                app.quit();
            });
        });

        server = expressApp.listen(port, () => {
            const url = `http://localhost:${port}/${filename}`;
            console.log(`[serveAndOpen] 🚀 Serving ${filename} at ${url}`);
            open(url);
        });
    } catch (e) {
        console.error("[serveAndOpen] Error:", e);
    }
}

app.on("window-all-closed", () => {
    console.log("[app] window-all-closed");
    if (server) server.close();
    if (process.platform !== "darwin") app.quit();
})
