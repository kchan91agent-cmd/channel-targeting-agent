import assert from "node:assert/strict";
import test from "node:test";
import { syncFromGitHub } from "../scripts/sync-check.mjs";

const localCommit = "1111111111111111111111111111111111111111";
const remoteCommit = "2222222222222222222222222222222222222222";

function result(status = 0, stdout = "") {
  return { status, stdout, stderr: "" };
}

function harness(responses) {
  const calls = [];
  const messages = [];
  const runGit = (args) => {
    calls.push(args);
    const key = args.join(" ");
    return responses[key] ?? result(1);
  };
  return {
    calls,
    messages,
    options: { runGit, log: (message) => messages.push(message), warn: (message) => messages.push(message) }
  };
}

test("continues with the cached commit when GitHub cannot be fetched", () => {
  const h = harness({
    "rev-parse HEAD": result(0, `${localCommit}\n`),
    "remote get-url origin": result(0, "https://github.com/example/project.git\n"),
    "fetch --quiet --no-tags origin main": result(1)
  });

  const sync = syncFromGitHub(h.options);
  assert.deepEqual(sync, { status: "cached", reason: "fetch-failed", commit: localCommit });
  assert.match(h.messages[0], /Continuing with cached version 111111111111/);
});

test("reports a current checkout without attempting a merge", () => {
  const h = harness({
    "rev-parse HEAD": result(0, `${localCommit}\n`),
    "remote get-url origin": result(0, "https://github.com/example/project.git\n"),
    "fetch --quiet --no-tags origin main": result(0),
    "rev-parse origin/main": result(0, `${localCommit}\n`)
  });

  const sync = syncFromGitHub(h.options);
  assert.deepEqual(sync, { status: "current", commit: localCommit });
  assert.equal(h.calls.some((args) => args[0] === "merge"), false);
});

test("fast-forwards a clean checkout that is behind GitHub main", () => {
  const h = harness({
    "rev-parse HEAD": result(0, `${localCommit}\n`),
    "remote get-url origin": result(0, "https://github.com/example/project.git\n"),
    "fetch --quiet --no-tags origin main": result(0),
    "rev-parse origin/main": result(0, `${remoteCommit}\n`),
    [`merge-base --is-ancestor ${localCommit} ${remoteCommit}`]: result(0),
    "status --porcelain --untracked-files=normal": result(0),
    "merge --ff-only origin/main": result(0)
  });

  const sync = syncFromGitHub(h.options);
  assert.deepEqual(sync, { status: "updated", previousCommit: localCommit, commit: remoteCommit });
});

test("does not update a checkout with local changes", () => {
  const h = harness({
    "rev-parse HEAD": result(0, `${localCommit}\n`),
    "remote get-url origin": result(0, "https://github.com/example/project.git\n"),
    "fetch --quiet --no-tags origin main": result(0),
    "rev-parse origin/main": result(0, `${remoteCommit}\n`),
    [`merge-base --is-ancestor ${localCommit} ${remoteCommit}`]: result(0),
    "status --porcelain --untracked-files=normal": result(0, " M package.json\n")
  });

  const sync = syncFromGitHub(h.options);
  assert.equal(sync.status, "cached");
  assert.equal(sync.reason, "local-changes");
  assert.equal(h.calls.some((args) => args[0] === "merge"), false);
});
