/**
 * Temple OS - Identity and Organization Types
 * Defines user, team, and organization identity structures
 */

export interface UserIdentity {
  user_id: string;
  org_id: string | null;
  active_team_id: string | null;
  active_org_id: string | null;
  roles: string[]; // e.g., ["individual", "manager", "CEO"]
  permissions: string[]; // fine-grained, e.g., ["view_financials", "manage_policies"]
  mode: "personal" | "team" | "org";
  auth_context: Record<string, any>;
}

export interface OrgProfile {
  org_id: string;
  name: string;
  industry: string;
  size: number;
  timezone: string;
  domains: string[]; // email domains
  connected_systems: string[]; // e.g. ["Jira", "Notion", "HubSpot"]
  created_at: string;
  updated_at: string;
}

export interface Team {
  team_id: string;
  org_id: string | null;
  name: string;
  created_by: string; // user_id
  created_at: string;
  updated_at: string;
}

export interface TeamMembership {
  team_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
}

export interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  timezone: string;
  preferred_language: string;
  ui_locale: string;
  goals: Goal[];
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  goal_id: string;
  user_id: string;
  org_id: string | null;
  team_id: string | null;
  title: string;
  description: string;
  category: "personal" | "professional" | "team" | "org";
  target_date: string | null;
  status: "active" | "completed" | "archived";
  created_at: string;
  updated_at: string;
}
