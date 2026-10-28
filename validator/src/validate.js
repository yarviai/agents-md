import { parse as parseYaml } from "yaml";
import { DEPRECATED_FIELDS, DEPRECATED_VERSIONS, FIELDS, GROUPS, KNOWN_VERSIONS, SPEC_VERSION } from "./fields.js";

const BY_NAME = new Map(FIELDS.map((f) => [f.name, f]));
const FRONT_MATTER = /^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const SIZED = ["apparel", "footwear"];
const INGESTED = ["food", "pantry", "beverage", "supplements", "wellness"];

/** Splits a file into its YAML front matter and Markdown body. */
export function splitFrontMatter(text) {
  const m = FRONT_MATTER.exec(text);
  if (!m) return { yaml: null, body: text };
  return { yaml: m[1] ?? "", body: text.slice(m[0].length) };
}

function isIsoDate(v) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
}

function httpsUrl(v) {
  if (typeof v !== "string") return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

function typeError(field, v) {
  switch (field.type) {
    case "string":
      return typeof v === "string" && v.trim() ? null : "must be a non-empty string";
    case "url":
      return httpsUrl(v) ? null : "must be an absolute https:// URL";
    case "int":
      return Number.isInteger(v) && v >= 0 ? null : "must be a whole number, 0 or more";
    case "bool":
      return typeof v === "boolean" ? null : "must be true or false";
    case "date":
      return isIsoDate(v) ? null : "must be a date written YYYY-MM-DD";
    case "email":
      return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "must be an email address";
    case "currency":
      return typeof v === "string" && /^[A-Z]{3}$/.test(v) ? null : "must be a 3-letter ISO 4217 code such as USD";
    case "range":
      return Array.isArray(v) && v.length === 2 && v.every((n) => Number.isInteger(n) && n >= 0) ? null : "must be [fastest, slowest], two whole numbers";
    case "array":
      return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string" && x.trim()) ? null : "must be a non-empty list of strings";
    default:
      return null;
  }
}

function distance(a, b) {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

function suggest(name) {
  let best = null;
  for (const f of FIELDS) {
    const d = distance(name, f.name);
    if (d <= 3 && (!best || d < best.d)) best = { name: f.name, d };
  }
  return best?.name ?? null;
}

const looksLikeShopifyDefault = (text) => /^#\s*Agent Instructions/m.test(text) && /shopify/i.test(text);

/**
 * Validates an agents.md file against spec v0.2.
 * @param {string} text the file's contents
 * @param {{ sourceUrl?: string, today?: Date }} [opts] sourceUrl turns on the canonical_url host check
 */
export function validate(text, opts = {}) {
  const issues = [];
  const add = (level, code, message, field = null) => issues.push({ level, code, field, message });
  const today = opts.today ?? new Date();
  let data = {};

  const { yaml, body } = splitFrontMatter(text ?? "");
  if (yaml === null) {
    add("error", "no_front_matter", "No YAML front matter. A v0.2 file starts with a --- block that holds the fields.");
    if (looksLikeShopifyDefault(text ?? "")) add("info", "shopify_default", "This looks like Shopify's default agents.md. It is valid Markdown for agents, but it carries none of the store-specific fields.");
  } else {
    try {
      const parsed = parseYaml(yaml);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) data = parsed;
      else add("error", "front_matter_not_mapping", "Front matter must be a set of key: value fields.");
    } catch (err) {
      add("error", "yaml_parse_error", `Front matter is not valid YAML: ${err instanceof Error ? err.message.split("\n")[0] : String(err)}`);
    }
  }

  // Version
  const version = data.agents_md_version == null ? null : String(data.agents_md_version);
  if (yaml !== null && version !== null) {
    if (DEPRECATED_VERSIONS[version]) add("warning", "deprecated_version", `Version ${version} is deprecated. ${DEPRECATED_VERSIONS[version]}`, "agents_md_version");
    else if (!KNOWN_VERSIONS.includes(version)) add("error", "unknown_version", `Version ${version} is not one this validator knows (latest is ${SPEC_VERSION}).`, "agents_md_version");
  }

  // Fields: required, types, unknown, deprecated
  for (const f of FIELDS) {
    const v = data[f.name];
    if (v === undefined || v === null) {
      if (f.required && yaml !== null) add("error", "missing_required", `${f.name} is required.`, f.name);
      continue;
    }
    const why = f.name === "agents_md_version" ? null : typeError(f, v);
    if (why) add("error", "wrong_type", `${f.name} ${why}.`, f.name);
  }
  for (const key of Object.keys(data)) {
    if (BY_NAME.has(key) || key.startsWith("x-")) continue;
    const dep = DEPRECATED_FIELDS[key];
    if (dep) {
      add("warning", "deprecated_field", `${key} is deprecated since ${dep.since}${dep.replacement ? `; use ${dep.replacement}` : ""}. Validators stop reading it in ${dep.removal}.`, key);
      continue;
    }
    const s = suggest(key);
    add("warning", "unknown_field", `${key} is not a v${SPEC_VERSION} field${s ? `. Did you mean ${s}?` : ". Prefix custom fields with x-."}`, key);
  }

  // Cross-field consistency
  const has = (k) => data[k] !== undefined && data[k] !== null;
  const ok = (k) => has(k) && !issues.some((i) => i.field === k && i.level === "error");
  if (ok("shipping_time_days_range")) {
    const [lo, hi] = data.shipping_time_days_range;
    if (lo > hi) add("error", "range_order", "shipping_time_days_range must list the fastest time first.", "shipping_time_days_range");
  }
  if (has("returns_window_days") && !has("returns_policy_url")) add("warning", "returns_without_policy", "returns_window_days is set but returns_policy_url is not. Agents need the full policy for exceptions.", "returns_policy_url");
  for (const k of ["supported_mcp_tools", "rate_limit_requests_per_minute"]) {
    if (has(k) && !has("agent_api_endpoint")) add("error", "agent_fields_without_endpoint", `${k} describes an agent endpoint, but agent_api_endpoint is missing.`, k);
  }
  if (has("color_matrix_available") && !has("variant_schema_version")) add("warning", "colors_without_variant_schema", "color_matrix_available is set without variant_schema_version, so agents can't tell how colors are modeled.", "variant_schema_version");
  if (ok("last_updated")) {
    const d = new Date(`${data.last_updated}T00:00:00Z`);
    const days = (today.getTime() - d.getTime()) / 86_400_000;
    if (days < -1) add("error", "last_updated_future", "last_updated is in the future.", "last_updated");
    else if (days > 365) add("warning", "stale", `last_updated is ${Math.floor(days)} days old. Agents may treat the file as out of date.`, "last_updated");
  }
  if (ok("canonical_url") && opts.sourceUrl) {
    const strip = (h) => h.replace(/^www\./, "");
    const src = httpsUrl(opts.sourceUrl) ?? (() => { try { return new URL(opts.sourceUrl); } catch { return null; } })();
    if (src && strip(new URL(data.canonical_url).hostname) !== strip(src.hostname)) {
      add("warning", "canonical_host_mismatch", `canonical_url points at ${new URL(data.canonical_url).hostname}, but the file was served from ${src.hostname}.`, "canonical_url");
    }
  }
  const cats = Array.isArray(data.categories) ? data.categories.map((c) => String(c).toLowerCase()) : [];
  if (cats.some((c) => SIZED.includes(c)) && !has("sizing_matrix_url")) add("warning", "apparel_without_sizing", "The store sells apparel or footwear but has no sizing_matrix_url.", "sizing_matrix_url");
  if (cats.some((c) => INGESTED.includes(c))) {
    if (data.ingredients_available !== true) add("warning", "food_without_ingredients", "The store sells food, drink or supplements but does not say ingredients are listed in text.", "ingredients_available");
    if (!has("allergens_list_url")) add("warning", "food_without_allergens", "The store sells food, drink or supplements but has no allergens_list_url.", "allergens_list_url");
  }
  if (data.member_pricing_available === true) add("info", "member_pricing", "Member prices differ from public ones. Agents will quote the public price.", "member_pricing_available");
  if (yaml !== null && !body.trim()) add("info", "empty_body", "The Markdown body is empty. Plain-language instructions for agents can follow the front matter.");

  // Scorecard
  const coverage = Object.fromEntries(
    Object.entries(GROUPS).map(([g, label]) => {
      const fields = FIELDS.filter((f) => f.group === g);
      return [g, { label, present: fields.filter((f) => ok(f.name)).length, total: fields.length }];
    }),
  );
  const present = FIELDS.filter((f) => ok(f.name)).length;
  const errors = issues.filter((i) => i.level === "error").length;
  const warnings = issues.filter((i) => i.level === "warning").length;
  const score = errors ? 0 : Math.max(0, Math.round(50 + (50 * present) / FIELDS.length) - 3 * warnings);
  return { valid: errors === 0, spec_version: SPEC_VERSION, file_version: version, score, errors, warnings, fields_present: present, fields_total: FIELDS.length, coverage, issues };
}
