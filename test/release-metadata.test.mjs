import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const expectedVersion = "2.2.1";

test("release metadata, documentation, and Docker publishing stay aligned", async () => {
  const [
    packageText,
    lockText,
    readme,
    changelog,
    versioning,
    workflow,
  ] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../CHANGELOG.md", import.meta.url), "utf8"),
    readFile(new URL("../VERSIONING.md", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/docker-publish.yml", import.meta.url), "utf8"),
  ]);

  const packageJson = JSON.parse(packageText);
  const lock = JSON.parse(lockText);
  assert.equal(packageJson.version, expectedVersion);
  assert.equal(lock.version, expectedVersion);
  assert.equal(lock.packages[""].version, expectedVersion);

  assert.equal(readme.includes(`release is **${expectedVersion}**`), true);
  assert.equal(readme.includes(`skuldgerry/discord-mcp:${expectedVersion}`), true);
  assert.equal(readme.includes("skuldgerry/discord-mcp:2.0.0"), false);
  assert.equal(changelog.includes(`## [${expectedVersion}] - 2026-10-13`), true);
  assert.equal(versioning.includes("Semantic Versioning"), true);

  assert.equal(workflow.includes("IMAGE_NAME: skuldgerry/discord-mcp"), true);
  assert.equal(
    workflow.includes("push: false"),
    true,
  );
  assert.equal(workflow.includes("docker/login-action"), false);
});
