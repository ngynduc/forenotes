import { spawn } from "node:child_process";

import http from "node:http";

const children = [];

children.push(startProcess("api", "npm", ["run", "dev:demo"]));
await waitForBackend();
children.push(startProcess("client", "npm", ["run", "dev:client"]));

let shuttingDown = false;

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(0));
}

Promise.all(children.map(waitForExit)).then((codes) => {
  const firstFailure = codes.find((code) => code !== 0);
  shutdown(firstFailure ?? 0);
});

function startProcess(name, command, args) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("error", (error) => {
    console.error(`[${name}] failed to start`, error);
    shutdown(1);
  });

  return child;
}

function waitForExit(child) {
  return new Promise((resolve) => {
    child.once("exit", (code, signal) => {
      if (signal) {
        resolve(1);
        return;
      }
      resolve(code ?? 0);
    });
  });
}

function waitForBackend(maxAttempts = 30) {
  const port = 8787;
  return new Promise((resolve, reject) => {
    let attempts = 0;
    function probe() {
      const req = http.get(`http://127.0.0.1:${port}/api/cases`, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        attempts++;
        if (attempts >= maxAttempts) {
          reject(new Error(`Backend on :${port} not ready after ${maxAttempts}s`));
          return;
        }
        setTimeout(probe, 1000);
      });
      req.setTimeout(2000, () => { req.destroy(); });
    }
    probe();
  });
}

function shutdown(code) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => process.exit(code), 50);
}
