#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env --unstable

import { listProjects, getIssue, listMergeRequests } from "./src/services/gitlab_client.ts";

function usage() {
  console.error("Usage: cli.ts <command> [options]\nCommands:\n  list-projects [--q=query]\n  get-issue --project <id> --iid <iid>\n  list-mrs --project <id>\n");
}

function parseArgs() {
  const args = Deno.args.slice();
  const cmd = args.shift();
  const out: Record<string, any> = { cmd, flags: {} };
  while (args.length) {
    const a = args.shift()!;
    if (a.startsWith("--")) {
      const k = a.replace(/^--/, "");
      const v = args[0] && !args[0].startsWith("--") ? args.shift() : true;
      out.flags[k] = v;
    } else {
      // positional (ignored for now)
    }
  }
  return out;
}

async function main() {
  const parsed = parseArgs();
  const cmd = parsed.cmd;
  const f = parsed.flags;
  try {
    if (cmd === "list-projects" || cmd === "list_projects") {
      const q = typeof f.q === "string" ? f.q : "";
      const res = await listProjects(q);
      console.log(JSON.stringify(res));
      Deno.exit(0);
    } else if (cmd === "get-issue" || cmd === "get_issue") {
      const project = Number(f.project || f.p);
      const iid = Number(f.iid);
      if (!project || !iid) {
        usage();
        Deno.exit(2);
      }
      const res = await getIssue(project, iid);
      console.log(JSON.stringify(res));
      Deno.exit(0);
    } else if (cmd === "list-mrs" || cmd === "list_mrs") {
      const project = Number(f.project || f.p);
      if (!project) { usage(); Deno.exit(2); }
      const res = await listMergeRequests(project);
      console.log(JSON.stringify(res));
      Deno.exit(0);
    } else {
      usage();
      Deno.exit(2);
    }
  } catch (e) {
    const err = { error: { message: String(e?.message || e), stack: e?.stack } };
    console.error(JSON.stringify(err));
    Deno.exit(1);
  }
}

if (import.meta.main) await main();
