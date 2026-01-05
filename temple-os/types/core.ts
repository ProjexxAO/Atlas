/**
 * Temple OS - Core Service Types
 * Defines service interfaces and temple architecture components
 */

import {
  RawRequest,
  ClassifiedRequest,
  TaskPlan,
  ContextBundle,
  Subtask,
  FinalResponse
} from "./requests";
import { PolicyCheckResult } from "./policies";

// Service response wrapper
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    service: string;
    timestamp: string;
    request_id: string;
    processing_time_ms: number;
  };
}

// Outer Court
export interface OuterCourtInput {
  raw_request: RawRequest;
}

export interface OuterCourtOutput {
  classified_request?: ClassifiedRequest;
  final_response?: FinalResponse; // for simple requests handled directly
  next_step: "complete" | "inner_court";
}

// Inner Court
export interface InnerCourtInput {
  classified_request: ClassifiedRequest;
}

export interface InnerCourtOutput {
  task_plan: TaskPlan;
  context_bundle: ContextBundle;
  priest_outputs: Record<string, any>;
  ready_for_sanctuary: boolean;
}

// Priestly Service
export interface PriestInput {
  subtask: Subtask;
  context: ContextBundle;
}

export interface PriestOutput {
  subtask: Subtask; // updated with outputs and status
  reasoning?: string;
  confidence_score?: number;
}

// Sanctuary
export interface SanctuaryInput {
  classified_request: ClassifiedRequest;
  task_plan: TaskPlan;
  context_bundle: ContextBundle;
  priest_outputs: Record<string, any>;
}

export interface SanctuaryOutput {
  final_response: FinalResponse; // before Ark review
  reasoning_trace?: string[];
}

// Ark/Covenant
export interface ArkPreCheckInput {
  classified_request: ClassifiedRequest;
  user_identity: any;
}

export interface ArkPostCheckInput {
  final_response: FinalResponse;
  classified_request: ClassifiedRequest;
}

export interface ArkOutput {
  policy_check: PolicyCheckResult;
  modified_response?: FinalResponse;
}

// Memory Service
export interface MemoryStoreInput {
  request_id: string;
  user_id: string;
  org_id: string | null;
  team_id: string | null;
  event_type: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface MemoryRetrieveInput {
  user_id: string;
  org_id?: string | null;
  team_id?: string | null;
  query?: string;
  limit?: number;
  memory_types?: string[];
}

// River Service
export interface RiverDispatchInput {
  actions: any[]; // ActionRecord[]
}

export interface RiverDispatchOutput {
  actions: any[]; // ActionRecord[] with updated statuses
}

// Priest capabilities
export const PRIEST_REGISTRY = {
  life: {
    id: "life",
    name: "Life Priest",
    description: "Personal goals, tasks, routines, and life planning",
    domains: ["life", "personal", "wellness", "habits"],
  },
  learning: {
    id: "learning",
    name: "Learning Priest",
    description: "Educational content, explanations, and study plans",
    domains: ["learning", "education", "knowledge"],
  },
  creator: {
    id: "creator",
    name: "Creator Priest",
    description: "Content creation and storytelling",
    domains: ["content", "writing", "creative"],
  },
  career: {
    id: "career",
    name: "Career Priest",
    description: "Career development, CV, and professional positioning",
    domains: ["career", "job", "professional_development"],
  },
  strategy: {
    id: "strategy",
    name: "Strategy Priest",
    description: "Strategic planning, OKRs, and business narratives",
    domains: ["strategy", "business", "planning", "okr"],
  },
  finance: {
    id: "finance",
    name: "Finance Priest",
    description: "Financial analysis and planning",
    domains: ["finance", "budget", "financial_planning"],
  },
  ops: {
    id: "ops",
    name: "Operations Priest",
    description: "Process optimization and operational excellence",
    domains: ["operations", "process", "efficiency"],
  },
  tech: {
    id: "tech",
    name: "Technology Priest",
    description: "Technical architecture and technology decisions",
    domains: ["technology", "architecture", "engineering"],
  },
  people: {
    id: "people",
    name: "People Priest",
    description: "Organizational structure and people management",
    domains: ["people", "hr", "organization", "team_structure"],
  },
  research: {
    id: "research",
    name: "Research Priest",
    description: "External intelligence and research",
    domains: ["research", "intelligence", "market_analysis"],
  },
} as const;

export type PriestId = keyof typeof PRIEST_REGISTRY;
