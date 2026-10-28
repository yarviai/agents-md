import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { FIELDS, agentsMdUrl, validate } from "../src/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const today = new Date("2026-10-28T12:00:00Z");
const file = (fields, body = "\nGuidance.\n") => `---\n${fields}\n---\n${body}`;
const base = 'agents_md_version: "0.2"\nbrand: Test\ncanonical_url: https://test.example\nlast_updated: "2026-10-01"';
const codes = (r) => r.issues.map((i) => i.code);

test("every example is valid with no warnings", () => {
  for (const name of ["olive-oil.md", "skincare.md", "apparel.md"]) {
    const r = validate(readFileSync(join(root, "examples", name), "utf8"), { today });
    assert.equal(r.valid, true, `${name}: ${JSON.stringify(r.issues)}`);
    assert.equal(r.warnings, 0, `${name}: ${JSON.stringify(r.issues)}`);
  }
});

test("SPEC.md documents every field the validator knows", () => {
  const spec = readFileSync(join(root, "SPEC.md"), "utf8");
  for (const f of FIELDS) assert.match(spec, new RegExp("\\| `" + f.name + "` \\|"), `${f.name} missing from SPEC.md`);
});

test("missing front matter is an error, and Shopify's default is named", () => {
  const r = validate("# Agent Instructions\n\nThis Shopify store welcomes agents.\n", { today });
  assert.equal(r.valid, false);
  assert.ok(codes(r).includes("no_front_matter"));
  assert.ok(codes(r).includes("shopify_default"));
  assert.equal(r.score, 0);
});

test("required fields and types", () => {
  const r = validate(file('agents_md_version: "0.2"\nbrand: ""\ncanonical_url: http://x.example\nlast_updated: 2026-13-40'), { today });
  assert.equal(r.valid, false);
  assert.deepEqual(r.issues.filter((i) => i.code === "wrong_type").map((i) => i.field).sort(), ["brand", "canonical_url", "last_updated"]);
});

test("cross-field rules", () => {
  const r = validate(
    file(`${base}\nshipping_time_days_range: [5, 2]\nsupported_mcp_tools: [search]\nreturns_window_days: 30\ncategories: [apparel, food]`),
    { today },
  );
  for (const c of ["range_order", "agent_fields_without_endpoint", "returns_without_policy", "apparel_without_sizing", "food_without_ingredients", "food_without_allergens"]) {
    assert.ok(codes(r).includes(c), `expected ${c}`);
  }
});

test("unknown fields get a suggestion; x- fields are allowed", () => {
  const r = validate(file(`${base}\nreturn_window_days: 30\nx-loyalty: yes`), { today });
  const unknown = r.issues.filter((i) => i.code === "unknown_field");
  assert.equal(unknown.length, 1);
  assert.match(unknown[0].message, /Did you mean returns_window_days/);
});

test("deprecation and version checks", () => {
  assert.ok(codes(validate(file(base.replace('"0.2"', '"9.9"')), { today })).includes("unknown_version"));
  assert.ok(codes(validate(file(base.replace("2026-10-01", "2030-01-01")), { today })).includes("last_updated_future"));
  assert.ok(codes(validate(file(base.replace("2026-10-01", "2024-01-01")), { today })).includes("stale"));
});

test("canonical host is compared with where the file was served", () => {
  const r = validate(file(base), { today, sourceUrl: "https://other.example/agents.md" });
  assert.ok(codes(r).includes("canonical_host_mismatch"));
  assert.ok(!codes(validate(file(base), { today, sourceUrl: "https://www.test.example/agents.md" })).includes("canonical_host_mismatch"));
});

test("a domain becomes https://<domain>/agents.md", () => {
  assert.equal(agentsMdUrl("graza.co").toString(), "https://graza.co/agents.md");
  assert.equal(agentsMdUrl("http://graza.co/some/page?x=1").toString(), "https://graza.co/agents.md");
});
