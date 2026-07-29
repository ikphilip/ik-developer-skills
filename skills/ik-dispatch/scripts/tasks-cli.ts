#!/usr/bin/env -S npx tsx
/**
 * tasks-cli.ts — read/update helper for a tasks.json produced by ik-plan-tasks.
 *
 * Usage:
 *   npx tsx tasks-cli.ts next-ready <tasks.json>
 *   npx tsx tasks-cli.ts set-status <tasks.json> <task-id> <status> [--note "text"]
 *
 * `next-ready` prints the single next task object (as JSON) whose status is
 * "pending" and whose depends_on are all "done", choosing the lowest `order`.
 * The returned object includes every field on the task (id, title, description,
 * files, architecture_refs, acceptance_criteria, depends_on, order, status,
 * dispatch_note, etc.) so the caller does not need to re-read tasks.json to
 * build a subagent prompt. Prints `null` if none are ready (either everything
 * is done, or the only remaining pending tasks are blocked on incomplete
 * dependencies).
 *
 * `set-status` updates one task's status in place: "pending" | "in_progress" |
 * "done" | "blocked". Rewrites the file atomically and prints the updated task.
 * An optional --note is stored on the task as `dispatch_note` (overwritten
 * each call, not appended) for recording why a task is blocked or what a
 * subagent reported.
 *
 * This script only ever touches tasks.json — it has no knowledge of source
 * code and must never be extended to write anything else.
 */

import { readFileSync, writeFileSync, renameSync } from "node:fs";

type Task = {
  id: string;
  title: string;
  status: string;
  order: number;
  depends_on: string[];
  dispatch_note?: string;
  [key: string]: unknown;
};

type TasksFile = {
  tasks: Task[];
  [key: string]: unknown;
};

const VALID_STATUSES = ["pending", "in_progress", "done", "blocked"];

function loadTasksFile(path: string): TasksFile {
  const raw = readFileSync(path, "utf-8");
  const parsed = JSON.parse(raw) as TasksFile;
  if (!Array.isArray(parsed.tasks)) {
    throw new Error(`${path} has no "tasks" array`);
  }
  return parsed;
}

function saveTasksFile(path: string, data: TasksFile): void {
  const tmpPath = `${path}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  renameSync(tmpPath, path);
}

function nextReady(path: string): Task | null {
  const { tasks } = loadTasksFile(path);
  const statusById = new Map(tasks.map((t) => [t.id, t.status]));

  const ready = tasks.filter((t) => {
    if (t.status !== "pending") return false;
    return t.depends_on.every((depId) => statusById.get(depId) === "done");
  });

  if (ready.length === 0) return null;

  ready.sort((a, b) => a.order - b.order);
  return ready[0];
}

function setStatus(
  path: string,
  taskId: string,
  status: string,
  note?: string
): Task {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(
      `Invalid status "${status}". Must be one of: ${VALID_STATUSES.join(", ")}`
    );
  }

  const data = loadTasksFile(path);
  const task = data.tasks.find((t) => t.id === taskId);
  if (!task) {
    throw new Error(`No task with id "${taskId}" in ${path}`);
  }

  task.status = status;
  if (note !== undefined) {
    task.dispatch_note = note;
  }

  saveTasksFile(path, data);
  return task;
}

function parseArgs(argv: string[]) {
  const [command, ...rest] = argv;
  const noteIndex = rest.indexOf("--note");
  let note: string | undefined;
  let positional = rest;
  if (noteIndex !== -1) {
    note = rest[noteIndex + 1];
    positional = [...rest.slice(0, noteIndex), ...rest.slice(noteIndex + 2)];
  }
  return { command, positional, note };
}

function main(): void {
  const { command, positional, note } = parseArgs(process.argv.slice(2));

  try {
    switch (command) {
      case "next-ready": {
        const [path] = positional;
        if (!path) throw new Error("Usage: next-ready <tasks.json>");
        console.log(JSON.stringify(nextReady(path), null, 2));
        break;
      }
      case "set-status": {
        const [path, taskId, status] = positional;
        if (!path || !taskId || !status) {
          throw new Error(
            'Usage: set-status <tasks.json> <task-id> <status> [--note "text"]'
          );
        }
        const updated = setStatus(path, taskId, status, note);
        console.log(JSON.stringify(updated, null, 2));
        break;
      }
      default:
        throw new Error(
          `Unknown command "${command}". Expected "next-ready" or "set-status".`
        );
    }
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
