#!/usr/bin/env node

const express = require("express");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

let server = null;

async function serveAndOpen(filePath) {
    try {
        const absPath = path.resolve(filePath)

        // Check if file exists
        if (!fs.existsSync(absPath)) {
            console.error(`Error: File not found: ${absPath}`)
            process.exit(1)
        }

        // Check if it's an HTML file
        if (!absPath.toLowerCase().endsWith(".html") && !absPath.toLowerCase().endsWith(".htm")) {
            console.error(`Error: Not an HTML file: ${absPath}`)
            process.exit(1)
        }

        const folder = path.dirname(absPath)
        const filename = path.basename(absPath)

        console.log(`[HTMLServe] Serving file: ${absPath}`)

        // Get available port (simplified version)
        const getAvailablePort = () => {
            return new Promise((resolve) => {
                const net = require("net")
                const server = net.createServer()
                server.listen(0, () => {
                    const port = server.address().port
                    server.close(() => resolve(port))
                })
            })
        }

        const port = await getAvailablePort()

        // Create Express application
        const expressApp = express()

        // Standard static file serving with enhanced permissions
        expressApp.use(
            express.static(folder, {
                dotfiles: "allow",
                etag: true,
                extensions: ["html", "htm"],
                fallthrough: true,
                immutable: false,
                index: false,
                lastModified: true,
                maxAge: 0,
                redirect: false,
                setHeaders: (res, path, stat) => {
                    // Set CORS headers for local development
                    res.set("Access-Control-Allow-Origin", "*")
                    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                    res.set("Access-Control-Allow-Headers", "Content-Type")
                },
            })
        )

        // Custom handler for special endpoints
        expressApp.use((req, res, next) => {
            if (req.path.startsWith("/__htmlserve_")) {
                return next()
            }

            // If we reach here, the static handler didn't find the file
            res.status(404).send(`File not found: ${req.path}`)
        })

        // Read and inject close script
        const htmlContent = fs.readFileSync(absPath, "utf8")
        const injected = htmlContent.replace(
            "</body>",
            `<script>
              // Multiple safeguards for page close detection
              let heartbeatInterval;
              let isUnloading = false;

              // Heartbeat mechanism - send heartbeat every 5 seconds
              function startHeartbeat() {
                heartbeatInterval = setInterval(() => {
                  if (!isUnloading) {
                    fetch('/__htmlserve_heartbeat__', {
                      method: 'POST',
                      keepalive: true
                    }).catch(() => {
                      // If heartbeat fails, server might be closed
                      clearInterval(heartbeatInterval);
                    });
                  }
                }, 5000);
              }

              // Page unload handling
              function handleUnload() {
                if (isUnloading) return;
                isUnloading = true;

                clearInterval(heartbeatInterval);

                // Method 1: fetch (modern browsers)
                fetch('/__htmlserve_unload__', {
                  method: 'POST',
                  keepalive: true,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reason: 'page_unload' })
                }).catch(() => {});

                // Method 2: sendBeacon (fallback)
                if (navigator.sendBeacon) {
                  navigator.sendBeacon('/__htmlserve_unload__',
                    JSON.stringify({ reason: 'beacon' }));
                }

                // Method 3: synchronous XMLHttpRequest (last resort)
                try {
                  const xhr = new XMLHttpRequest();
                  xhr.open('POST', '/__htmlserve_unload__', false);
                  xhr.setRequestHeader('Content-Type', 'application/json');
                  xhr.send(JSON.stringify({ reason: 'xhr_sync' }));
                } catch (e) {}
              }

              // Listen to various unload events
              window.addEventListener('beforeunload', handleUnload);
              window.addEventListener('unload', handleUnload);
              window.addEventListener('pagehide', handleUnload);

              // Browser tab visibility change detection
              document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                  // Tab is hidden, might be closing
                  setTimeout(() => {
                    if (document.visibilityState === 'hidden') {
                      handleUnload();
                    }
                  }, 2000); // If still hidden after 2 seconds, trigger unload
                }
              });

              // Start heartbeat
              startHeartbeat();

              // Page loaded notification
              fetch('/__htmlserve_loaded__', { method: 'POST' }).catch(() => {});
            </script></body>`
        )

        // Serve HTML file
        expressApp.get(`/${filename}`, (req, res) => {
            res.setHeader("Content-Type", "text/html")
            res.send(injected)
        })

        // Handle page close
        expressApp.post("/__htmlserve_unload__", (req, res) => {
            console.log("[HTMLServe] Page closed, shutting down server...")
            res.sendStatus(200)
            setTimeout(() => {
                if (server) {
                    server.close(() => {
                        console.log("[HTMLServe] Server closed.")
                        process.exit(0)
                    })
                }
            }, 100)
        })

        // Heartbeat detection
        let lastHeartbeat = Date.now()
        let pageLoaded = false
        expressApp.post("/__htmlserve_heartbeat__", (req, res) => {
            lastHeartbeat = Date.now()
            res.sendStatus(200)
        })

        // Page loaded notification
        expressApp.post("/__htmlserve_loaded__", (req, res) => {
            console.log("[HTMLServe] Page loaded successfully")
            pageLoaded = true
            lastHeartbeat = Date.now()
            res.sendStatus(200)
        })

        // Enhanced heartbeat timeout detection - only start after page is loaded
        const heartbeatTimeout = setInterval(() => {
            if (pageLoaded && Date.now() - lastHeartbeat > 8000) {
                // Reduced from 15000 to 8000
                console.log("[HTMLServe] Heartbeat timeout, shutting down server...")
                clearInterval(heartbeatTimeout)
                if (server) {
                    server.close(() => {
                        console.log("[HTMLServe] Server closed due to heartbeat timeout.")
                        process.exit(0)
                    })
                }
            }
        }, 3000) // Check more frequently

        // Additional safety: Force exit after 5 minutes regardless
        const forceExitTimeout = setTimeout(() => {
            console.log("[HTMLServe] Force exit after 5 minutes timeout...")
            process.exit(0)
        }, 5 * 60 * 1000) // 5 minutes

        // Clear the force exit timeout if we exit normally
        const originalExit = process.exit
        process.exit = function (code) {
            clearTimeout(forceExitTimeout)
            clearInterval(heartbeatTimeout)
            originalExit.call(process, code)
        }

        // Start server
        server = expressApp.listen(port, async () => {
            const url = `http://localhost:${port}/${filename}`
            console.log(`[HTMLServe] 🚀 Serving ${filename} at ${url}`)

            // Open browser using native macOS open command
            exec(`open "${url}"`, (error) => {
                if (error) {
                    console.log(`[HTMLServe] Please open ${url} in your browser manually`)
                    console.error(`[HTMLServe] Failed to auto-open browser: ${error.message}`)
                } else {
                    console.log(`[HTMLServe] Browser opened successfully`)
                }
            })
        })

        // Handle process exit
        process.on("SIGINT", () => {
            console.log("\n[HTMLServe] Received SIGINT, shutting down gracefully...")
            if (server) {
                server.close(() => {
                    console.log("[HTMLServe] Server closed.")
                    process.exit(0)
                })
            } else {
                process.exit(0)
            }
        })

        process.on("SIGTERM", () => {
            console.log("\n[HTMLServe] Received SIGTERM, shutting down gracefully...")
            if (server) {
                server.close(() => {
                    console.log("[HTMLServe] Server closed.")
                    process.exit(0)
                })
            } else {
                process.exit(0)
            }
        })
    } catch (error) {
        console.error("[HTMLServe] Error:", error.message);
        process.exit(1);
    }
}

// Parse command line arguments
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error("Usage: htmlserve <file.html>");
        console.error("Example: htmlserve index.html");
        process.exit(1);
    }

    if (args[0] === '--help' || args[0] === '-h') {
        console.log("HTMLServe - Preview local HTML files with automatic HTTP server");
        console.log("");
        console.log("Usage: htmlserve <file.html>");
        console.log("");
        console.log("Options:");
        console.log("  -h, --help     Show this help message");
        console.log("  -v, --version  Show version number");
        process.exit(0);
    }

    if (args[0] === '--version' || args[0] === '-v') {
        const packageJson = require('./package.json');
        console.log(packageJson.version);
        process.exit(0);
    }

    const filePath = args[0];
    serveAndOpen(filePath);
}

if (require.main === module) {
    main();
}

module.exports = { serveAndOpen };
