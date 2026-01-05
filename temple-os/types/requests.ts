/**
 * Temple OS - Request and Response Types
 * Defines the flow of data through the temple architecture
 */

import { UserIdentity } from "./identity";

export interface RawRequest {
  request_id: string;
  timestamp: string; // ISO
  channel: "web" | "mobile" | "voice" | "api";
  user_identity: UserIdentity;
  raw_input: string | Record<string, any>;
  metadata: Record<string, any>; // locale, device, etc.
}

export interface ClassifiedRequest {
  request_id: string;
  user_identity: UserIdentity;
  normalized_text: string;
  language: string;
  preferred_language: string;
  ui_locale: string;
  domain: string; // "life", "work", "team", "org", "strategy", "finance", etc.
  intent: string; // e.g. "ask_question", "plan", "analyze_doc", "summarize"
  priority: "low" | "normal" | "high";
  sensitivity: "public" | "internal" | "confidential";
  safety_flags: string[];
  requires_inner_court: boolean;
  attachments: Attachment[];
}

export interface Attachment {
  attachment_id: string;
  type: "file" | "url" | "text_snippet";
  mime_type: string;
  location: string; // URL or storage key
  summary: string | null;
}

export interface TaskPlan {
  plan_id: string;
  request_id: string;
  high_level_goal: string;
  subtasks: Subtask[];
  required_capabilities: string[];
  target_priests: string[];
  estimated_complexity: "low" | "medium" | "high";
  needs_alignment_review: boolean;
}

export interface Subtask {
  subtask_id: string;
  description: string;
  assigned_priest: string;
  inputs: Record<string, any>;
  status: "pending" | "in_progress" | "completed" | "failed";
  outputs: Record<string, any> | null;
  error?: string;
}

export interface ContextBundle {
  request_id: string;
  user_context: Record<string, any>; // identity, preferences
  personal_context: Record<string, any>; // goals, projects, history
  team_contexts: TeamContext[];
  org_context: Record<string, any> | null;
  domain_knowledge: KnowledgeSnippet[];
  short_term_memory: MemoryItem[];
  long_term_memory_refs: string[];
  policies_applicable: string[];
}

export interface TeamContext {
  team_id: string;
  name: string;
  members: { user_id: string; role: string }[];
  projects: any[];
}

export interface KnowledgeSnippet {
  snippet_id: string;
  source: string; // "file", "wiki", "crm", etc.
  title: string;
  content: string;
  relevance_score: number;
  metadata: Record<string, any>;
}

export interface MemoryItem {
  memory_id: string;
  org_id: string | null;
  team_id: string | null;
  user_id: string | null;
  type: MemoryType;
  content: string;
  embedding_vector: number[] | null;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export type MemoryType = "fact" | "preference" | "decision" | "plan" | "summary" | "insight";

export interface LLMCallSpec {
  model: string;
  system_prompt: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature: number;
  max_tokens: number;
  tools?: any[];
  stop_sequences?: string[] | null;
}

export interface LLMCallResult {
  raw_response: string;
  parsed_content: string | Record<string, any>;
  used_tools: any[];
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ActionRecord {
  action_id: string;
  type: string; // "create_ticket", "send_email", "update_doc", etc.
  status: "pending" | "completed" | "failed";
  target_system: string;
  payload: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
}

export interface FinalResponse {
  request_id: string;
  user_facing_text: string;
  structured_output: Record<string, any> | null;
  explanations: Record<string, any>;
  actions_triggered: ActionRecord[];
  metadata?: {
    services_used: string[];
    total_tokens: number;
    processing_time_ms: number;
  };
}
