const { execSync, spawn } = require("node:child_process");

startServices();

process.on("SIGINT", () => {
  console.log("[SIGINT]: Stopping services...");
  stopServices();
});
process.on("SIGTERM", () => {
  console.log("[SIGTERM]: Stopping services...");
  stopServices();
});

function stopServices() {
  console.log("All services stopped.");
  execSync("npm run services:stop");
}

function startServices() {
  console.info("Starting services...");
  execSync("npm run services:up");
  execSync("npm run services:wait:database");
  execSync("npm run migrations:up");
  spawn("node", ["node_modules/next/dist/bin/next", "dev"], {
    stdio: "inherit",
  });
}
