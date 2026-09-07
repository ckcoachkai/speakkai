import { spawn } from "node:child_process";
const child = spawn(process.execPath, ["node_modules/astro/astro.js", "dev", "--host", "127.0.0.1", "--port", "4326"], {
  stdio: "inherit", env: { ...process.env, KEYSTATIC_LOCAL: "1" },
});
child.on("error", error => { console.error(error.message); process.exitCode = 1; });
child.on("exit", code => { process.exitCode = code ?? 1; });
