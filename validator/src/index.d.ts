export type FieldType = "string" | "url" | "int" | "bool" | "date" | "email" | "array" | "currency" | "range";

export interface FieldSpec {
  name: string;
  group: string;
  type: FieldType;
  items?: FieldType;
  required: boolean;
  status: "stable" | "provisional";
  example: unknown;
  intent: string;
}

export interface Issue {
  level: "error" | "warning" | "info";
  code: string;
  field: string | null;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  spec_version: string;
  file_version: string | null;
  score: number;
  errors: number;
  warnings: number;
  fields_present: number;
  fields_total: number;
  coverage: Record<string, { label: string; present: number; total: number }>;
  issues: Issue[];
}

export declare const SPEC_VERSION: string;
export declare const KNOWN_VERSIONS: string[];
export declare const DEPRECATED_VERSIONS: Record<string, string>;
export declare const DEPRECATED_FIELDS: Record<string, { replacement: string | null; since: string; removal: string }>;
export declare const FIELDS: FieldSpec[];
export declare const GROUPS: Record<string, string>;
export declare const USER_AGENT: string;
export declare const MAX_BYTES: number;

export declare function splitFrontMatter(text: string): { yaml: string | null; body: string };
export declare function validate(text: string, opts?: { sourceUrl?: string; today?: Date }): ValidationResult;
export declare function agentsMdUrl(input: string): URL;
export declare function fetchAgentsMd(
  input: string,
  opts?: { fetchImpl?: typeof fetch; timeoutMs?: number },
): Promise<{ url: string; status: number; contentType: string | null; text: string; truncated: boolean }>;
