/**
 * Temple OS - Policy and Governance Types
 * Defines alignment, safety, and governance structures (Ark/Covenant)
 */

export interface Policy {
  policy_id: string;
  org_id: string | null; // null = global policy
  name: string;
  description: string;
  check_type: "pre" | "post";
  match_criteria: MatchCriteria;
  handler_type: "block" | "modify" | "warn" | "log";
  config: Record<string, any>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatchCriteria {
  domains?: string[]; // e.g., ["finance", "strategy"]
  intents?: string[];
  sensitivity_levels?: string[];
  user_roles?: string[];
  keywords?: string[];
  custom_logic?: string; // for advanced matching
}

export interface PolicyCheckResult {
  allowed: boolean;
  modified_output: string | null;
  blocked_reason: string | null;
  policy_ids_triggered: string[];
  warnings: string[];
}

export interface AlignmentCheck {
  check_id: string;
  request_id: string;
  check_type: "pre" | "post";
  timestamp: string;
  policies_evaluated: string[];
  result: PolicyCheckResult;
  original_content?: string;
  modified_content?: string;
}
