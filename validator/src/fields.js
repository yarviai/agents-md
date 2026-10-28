// The agents.md v0.2 field table. SPEC.md documents every field here (CI checks that), and the validator
// checks files against it. Change a field here and in SPEC.md together.

/** @typedef {"string" | "url" | "int" | "bool" | "date" | "email" | "array" | "currency" | "range"} FieldType */

export const SPEC_VERSION = "0.2";

/** Versions the validator reads. A file on a version listed in DEPRECATED_VERSIONS gets a warning. */
export const KNOWN_VERSIONS = ["0.2"];
/** @type {Record<string, string>} version → what to do instead */
export const DEPRECATED_VERSIONS = {};
/**
 * Renamed or retired fields: old name → { replacement, since, removal }. The validator warns on each one
 * and still reads the old name until `removal`. 0.2 is the first published version, so this starts empty.
 * @type {Record<string, { replacement: string | null, since: string, removal: string }>}
 */
export const DEPRECATED_FIELDS = {};

/**
 * status: "stable" fields keep their name and type until 1.0, and after that are removed only after a
 * deprecation period (see SPEC.md, Deprecation). "provisional" fields may change in 0.3.
 * @type {Array<{ name: string, group: string, type: FieldType, items?: FieldType, required: boolean, status: "stable" | "provisional", example: unknown, intent: string }>}
 */
export const FIELDS = [
  // Core
  { name: "agents_md_version", group: "core", type: "string", required: true, status: "stable", example: "0.2", intent: "Which version of this spec the file follows." },
  { name: "brand", group: "core", type: "string", required: true, status: "stable", example: "Hillside Olive Co.", intent: "The brand name as shoppers know it." },
  { name: "description", group: "core", type: "string", required: false, status: "stable", example: "Single-estate olive oil from one grove in Paso Robles.", intent: "One or two plain sentences an agent can quote when introducing the store." },
  { name: "canonical_url", group: "core", type: "url", required: true, status: "stable", example: "https://hillside-olive.example", intent: "The store's main origin. Agents use it to confirm they are on the official store." },
  { name: "last_updated", group: "core", type: "date", required: true, status: "stable", example: "2026-10-28", intent: "When a person last confirmed this file is accurate." },
  { name: "contact_email", group: "core", type: "email", required: false, status: "stable", example: "agents@hillside-olive.example", intent: "Where an agent operator reports a problem with this file or the store's agent endpoints." },
  { name: "categories", group: "core", type: "array", items: "string", required: false, status: "provisional", example: ["food", "pantry"], intent: "What the store sells. Turns on category checks (sizing for apparel, ingredients for food)." },

  // Catalog
  { name: "products_feed_url", group: "catalog", type: "url", required: false, status: "stable", example: "https://hillside-olive.example/products.json", intent: "A machine-readable product list an agent can read instead of crawling pages." },
  { name: "product_schema_version", group: "catalog", type: "string", required: false, status: "stable", example: "schema.org/Product", intent: "Which product vocabulary the feed and product pages use." },
  { name: "inventory_status_url", group: "catalog", type: "url", required: false, status: "provisional", example: "https://hillside-olive.example/inventory.json", intent: "Where to check stock before recommending an item." },
  { name: "pricing_currency", group: "catalog", type: "currency", required: false, status: "stable", example: "USD", intent: "ISO 4217 code for the prices the store shows." },
  { name: "member_pricing_available", group: "catalog", type: "bool", required: false, status: "stable", example: false, intent: "True if logged-in or member prices differ from what an agent sees." },

  // Policy
  { name: "returns_window_days", group: "policy", type: "int", required: false, status: "stable", example: 30, intent: "Days after delivery a customer can start a return." },
  { name: "returns_policy_url", group: "policy", type: "url", required: false, status: "stable", example: "https://hillside-olive.example/policies/refund-policy", intent: "The full returns policy, for anything the number doesn't cover." },
  { name: "warranty_policy_url", group: "policy", type: "url", required: false, status: "stable", example: "https://hillside-olive.example/pages/guarantee", intent: "Warranty or guarantee terms, if the store offers any." },
  { name: "shipping_regions", group: "policy", type: "array", items: "string", required: false, status: "stable", example: ["US", "CA"], intent: "ISO 3166-1 alpha-2 country codes the store ships to." },
  { name: "shipping_time_days_range", group: "policy", type: "range", required: false, status: "stable", example: [2, 5], intent: "Typical business days from order to delivery, as [fastest, slowest]." },

  // Sizing and variants
  { name: "sizing_matrix_url", group: "variants", type: "url", required: false, status: "stable", example: "https://brookline-apparel.example/pages/size-chart", intent: "Size chart an agent can use to pick a size. Expected for apparel and footwear." },
  { name: "variant_schema_version", group: "variants", type: "string", required: false, status: "provisional", example: "schema.org/ProductGroup", intent: "How variants (size, color) are modeled in the feed and on product pages." },
  { name: "color_matrix_available", group: "variants", type: "bool", required: false, status: "provisional", example: true, intent: "True if each color has its own variant with its own images and stock." },

  // Ingredients and allergens
  { name: "ingredients_available", group: "ingredients", type: "bool", required: false, status: "stable", example: true, intent: "True if every product page lists full ingredients in text, not only in images." },
  { name: "allergens_list_url", group: "ingredients", type: "url", required: false, status: "stable", example: "https://hillside-olive.example/pages/allergens", intent: "One page listing allergens across the catalog." },
  { name: "nutrition_facts_url", group: "ingredients", type: "url", required: false, status: "provisional", example: "https://hillside-olive.example/pages/nutrition", intent: "Nutrition facts in text for food and supplements." },

  // Agent-only
  { name: "agent_promotions_available", group: "agent", type: "bool", required: false, status: "provisional", example: false, intent: "True if the store offers promotions only to orders placed through an agent." },
  { name: "agent_api_endpoint", group: "agent", type: "url", required: false, status: "provisional", example: "https://hillside-olive.example/api/mcp", intent: "Where an agent can call the store directly, for example an MCP server." },
  { name: "supported_mcp_tools", group: "agent", type: "array", items: "string", required: false, status: "provisional", example: ["search_catalog", "get_product"], intent: "Tool names the endpoint exposes, so an agent knows before it connects." },
  { name: "rate_limit_requests_per_minute", group: "agent", type: "int", required: false, status: "provisional", example: 60, intent: "The request rate an identified agent can expect before it is throttled." },
];

export const GROUPS = {
  core: "Core",
  catalog: "Catalog",
  policy: "Policy",
  variants: "Sizing and variants",
  ingredients: "Ingredients and allergens",
  agent: "Agent-only",
};
