#!/usr/bin/env node
// agents-md-validator check <url-or-file> [--json]
import { existsSync, readFileSync } from "node:fs";
import { fetchAgentsMd } from "./fetch.js";
import { validate } from "./validate.js";

const args = process.argv.slice(2);
const json = args.includes("--json");
const [cmd, target] = args.filter((a) => !a.startsWith("--"));

if (cmd !== "check" || !target) {
  console.error("usage: agents-md-validator check <url-or-file> [--json]");
  process.exit(2);
}

let text;
let sourceUrl;
let fetched = null;
try {
  if (existsSync(target)) {
    text = readFileSync(target, "utf8");
  } else {
    fetched = await fetchAgentsMd(target);
    sourceUrl = fetched.url;
    if (fetched.status !== 200) {
      const out = { valid: false, source: fetched.url, http_status: fetched.status, error: `GET ${fetched.url} returned ${fetched.status}` };
      console.log(json ? JSON.stringify(out, null, 2) : out.error);
      process.exit(1);
    }
    text = fetched.text;
  }
} catch (err) {
  console.error(`could not read ${target}: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(2);
}

const result = validate(text, { sourceUrl });
if (json) {
  console.log(JSON.stringify({ source: sourceUrl ?? target, ...result }, null, 2));
} else {
  console.log(`${sourceUrl ?? target}`);
  console.log(`${result.valid ? "VALID" : "INVALID"} against agents.md v${result.spec_version}  score ${result.score}/100  fields ${result.fields_present}/${result.fields_total}`);
  for (const c of Object.values(result.coverage)) console.log(`  ${c.label.padEnd(26)} ${c.present}/${c.total}`);
  for (const i of result.issues) console.log(`${i.level.toUpperCase().padEnd(8)}${i.field ? `${i.field}: ` : ""}${i.message}`);
}
process.exit(result.valid ? 0 : 1);
