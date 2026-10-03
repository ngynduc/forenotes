import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const repository = path.resolve(import.meta.dirname, "..");
let workspace: string;
let installDirectory: string;
let mockBin: string;

beforeEach(() => {
  workspace = mkdtempSync(path.join(os.tmpdir(), "forenotes-install-test-"));
  installDirectory = path.join(workspace, "production");
  mockBin = path.join(workspace, "bin");
  mkdirSync(mockBin);
  mkdirSync(installDirectory);
  writeFileSync(path.join(mockBin, "curl"), `#!/bin/bash
while (($#)); do
  if [[ "$1" == "--output" ]]; then
    cp "$TEST_COMPOSE_SOURCE" "$2"
    exit 0
  fi
  shift
done
exit 0
`, { mode: 0o755 });
  writeFileSync(path.join(mockBin, "docker"), `#!/bin/bash
printf '%s\\n' "$*" >> "$TEST_DOCKER_LOG"
if [[ "$*" == *" pull" && "$TEST_FAIL_PULL" == "true" ]]; then
  exit 1
fi
`, { mode: 0o755 });
});

afterEach(() => rmSync(workspace, { recursive: true, force: true }));

function runInstaller(extraEnv: Record<string, string> = {}) {
  const environment = { ...process.env };
  for (const key of Object.keys(environment)) {
    if (key.startsWith("FORENOTES_") || key === "SECURE_SESSION_COOKIES") {
      delete environment[key];
    }
  }
  return execFileSync("bash", [path.join(repository, "install.sh"), "--dir", installDirectory], {
    env: {
      ...environment,
      PATH: `${mockBin}:${process.env.PATH}`,
      TEST_COMPOSE_SOURCE: path.join(repository, "docker-compose.prod.yml"),
      TEST_DOCKER_LOG: path.join(workspace, "docker.log"),
      ...extraEnv,
    },
    encoding: "utf8",
    stdio: "pipe",
  });
}

function environmentFile() {
  return readFileSync(path.join(installDirectory, ".env.production"), "utf8");
}

describe("production installer", () => {
  it("configures the bundled report service on a fresh install", () => {
    const output = runInstaller();
    expect(environmentFile()).toContain("LITELLM_SERVICE_URL=http://report-llm-service:8001");
    expect(environmentFile()).toContain("FORENOTES_REPORT_LLM_IMAGE=ngynduc/forenotes-report-llm:0.2.2");
    expect(output).toContain("Report LLM service is installed");
    const commands = readFileSync(path.join(workspace, "docker.log"), "utf8");
    expect(commands).toContain(" pull\n");
    expect(commands).toContain(" up -d\n");
  });

  it("uses image overrides for new installations", () => {
    runInstaller({ FORENOTES_IMAGE: "example/app:test", FORENOTES_REPORT_LLM_IMAGE: "example/report:test" });
    expect(environmentFile()).toContain("FORENOTES_IMAGE=example/app:test");
    expect(environmentFile()).toContain("FORENOTES_REPORT_LLM_IMAGE=example/report:test");
  });

  it.each(["", "LITELLM_SERVICE_URL=\n"])("adds the bundled service URL to an old install (%j)", (url) => {
    const existing = "FORENOTES_IMAGE=example/app:old\nFORENOTES_LLM_SECRET_KEY=keep-this-key\nFORENOTES_BOOTSTRAP_ADMIN_PASSWORD=keep-this-password\n";
    writeFileSync(path.join(installDirectory, ".env.production"), existing + url);
    runInstaller();
    expect(environmentFile()).toContain(existing);
    expect(environmentFile()).toContain("LITELLM_SERVICE_URL=http://report-llm-service:8001");
    expect(environmentFile()).toContain("FORENOTES_REPORT_LLM_IMAGE=");
    const migrated = environmentFile();
    runInstaller();
    expect(environmentFile()).toBe(migrated);
  });

  it("preserves external report URLs, image pins, and existing credentials", () => {
    const existing = "LITELLM_SERVICE_URL=https://report.example.com\nFORENOTES_REPORT_LLM_IMAGE=example/report:old\nFORENOTES_BOOTSTRAP_ADMIN_PASSWORD=keep-this-password\n";
    writeFileSync(path.join(installDirectory, ".env.production"), existing);
    runInstaller();
    expect(environmentFile()).toBe(existing);
  });

  it("stops before starting containers or claiming success when pulling fails", () => {
    let failure: unknown;
    try {
      runInstaller({ TEST_FAIL_PULL: "true" });
    } catch (error) {
      failure = error;
    }
    expect(failure).toMatchObject({ status: 1 });
    const commands = readFileSync(path.join(workspace, "docker.log"), "utf8");
    expect(commands).toContain(" pull\n");
    expect(commands).not.toContain(" up -d\n");
  });
});

let dockerAvailable = false;
try {
  execFileSync("docker", ["compose", "version"], { stdio: "ignore" });
  dockerAvailable = true;
} catch {
  // Installer tests remain usable on development machines without Docker.
}

describe.skipIf(!dockerAvailable)("production Compose", () => {
  it.each([undefined, "", "https://report.example.com"])("includes the service and routes reports with URL override %j", (serviceUrl) => {
    const environment = { ...process.env };
    for (const key of Object.keys(environment)) {
      if (key.startsWith("FORENOTES_") || key.startsWith("LLM_") || key === "LITELLM_SERVICE_URL") {
        delete environment[key];
      }
    }
    if (serviceUrl !== undefined) environment.LITELLM_SERVICE_URL = serviceUrl;
    const config = JSON.parse(execFileSync("docker", [
      "compose", "--env-file", path.join(repository, ".env.production.example"),
      "-f", path.join(repository, "docker-compose.prod.yml"), "config", "--format", "json",
    ], {
      env: { ...environment, FORENOTES_LLM_ALLOWED_HOSTS: "models.example.com", FORENOTES_ALLOW_UNSAFE_LLM_ENDPOINTS: "true" },
      encoding: "utf8",
    }));
    expect(Object.keys(config.services).sort()).toEqual(["app", "postgres", "report-llm-service"]);
    expect(config.services.app.environment.LITELLM_SERVICE_URL).toBe(serviceUrl || "http://report-llm-service:8001");
    expect(config.services.app.depends_on["report-llm-service"].condition).toBe("service_healthy");
    expect(config.services["report-llm-service"].ports).toBeUndefined();
    expect(config.services["report-llm-service"].environment.FORENOTES_LLM_ALLOWED_HOSTS).toBe("models.example.com");
    expect(config.services["report-llm-service"].environment.FORENOTES_ALLOW_UNSAFE_LLM_ENDPOINTS).toBe("true");
    expect(config.services.app.volumes).toContainEqual(expect.objectContaining({ source: "forenotes_app_data", target: "/app/data" }));
  });
});
