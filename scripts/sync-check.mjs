#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function defaultRunGit(args) {
  return spawnSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    timeout: 20_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }
  });
}

function output(result) {
  return result?.stdout?.trim() ?? "";
}

function succeeded(result) {
  return result?.status === 0;
}

function shortCommit(commit) {
  return commit ? commit.slice(0, 12) : "unknown commit";
}

export function syncFromGitHub({ runGit = defaultRunGit, log = console.log, warn = console.warn } = {}) {
  const headResult = runGit(["rev-parse", "HEAD"]);
  if (!succeeded(headResult)) {
    warn("Update check unavailable: this project is not a readable Git checkout. Continuing with the cached project files.");
    return { status: "cached", reason: "git-unavailable", commit: null };
  }

  const head = output(headResult);
  const remoteResult = runGit(["remote", "get-url", "origin"]);
  if (!succeeded(remoteResult)) {
    warn(`Update check unavailable: Git remote 'origin' is not configured. Continuing with cached version ${shortCommit(head)}.`);
    return { status: "cached", reason: "origin-unavailable", commit: head };
  }

  const fetchResult = runGit(["fetch", "--quiet", "--no-tags", "origin", "main"]);
  if (!succeeded(fetchResult)) {
    warn(`GitHub update check could not complete. Continuing with cached version ${shortCommit(head)}.`);
    return { status: "cached", reason: "fetch-failed", commit: head };
  }

  const remoteHeadResult = runGit(["rev-parse", "origin/main"]);
  if (!succeeded(remoteHeadResult)) {
    warn(`GitHub's main branch could not be resolved after fetch. Continuing with cached version ${shortCommit(head)}.`);
    return { status: "cached", reason: "remote-main-unavailable", commit: head };
  }

  const remoteHead = output(remoteHeadResult);
  if (head === remoteHead) {
    log(`Channel Targeting Agent is current at ${shortCommit(head)}.`);
    return { status: "current", commit: head };
  }

  const localIsBehind = succeeded(runGit(["merge-base", "--is-ancestor", head, remoteHead]));
  if (localIsBehind) {
    const worktreeResult = runGit(["status", "--porcelain", "--untracked-files=normal"]);
    if (!succeeded(worktreeResult) || output(worktreeResult)) {
      warn(`A newer GitHub version is available, but the checkout has local changes. Continuing safely with cached version ${shortCommit(head)}.`);
      return { status: "cached", reason: "local-changes", commit: head, availableCommit: remoteHead };
    }

    const mergeResult = runGit(["merge", "--ff-only", "origin/main"]);
    if (!succeeded(mergeResult)) {
      warn(`A newer GitHub version is available, but it could not be applied safely. Continuing with cached version ${shortCommit(head)}.`);
      return { status: "cached", reason: "fast-forward-failed", commit: head, availableCommit: remoteHead };
    }

    log(`Updated Channel Targeting Agent from ${shortCommit(head)} to ${shortCommit(remoteHead)}.`);
    return { status: "updated", previousCommit: head, commit: remoteHead };
  }

  const remoteIsBehind = succeeded(runGit(["merge-base", "--is-ancestor", remoteHead, head]));
  if (remoteIsBehind) {
    warn(`The local checkout is ahead of GitHub main. Continuing with local version ${shortCommit(head)}.`);
    return { status: "cached", reason: "local-ahead", commit: head, remoteCommit: remoteHead };
  }

  warn(`The local checkout and GitHub main have diverged. Continuing safely with cached version ${shortCommit(head)}.`);
  return { status: "cached", reason: "diverged", commit: head, availableCommit: remoteHead };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  syncFromGitHub();
}
