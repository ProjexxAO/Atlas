-- Temple OS - Initial Database Schema
-- Complete schema with multi-tenant isolation via Row Level Security

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- IDENTITY & ORGANIZATIONS
-- ============================================================================

-- Organizations table
CREATE TABLE orgs (
  org_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  size INTEGER,
  timezone TEXT DEFAULT 'UTC',
  domains TEXT[] DEFAULT '{}',
  connected_systems TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  preferred_language TEXT DEFAULT 'en',
  ui_locale TEXT DEFAULT 'en-US',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Organization relationships
CREATE TABLE user_orgs (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(org_id) ON DELETE CASCADE,
  roles TEXT[] DEFAULT '{}',
  permissions TEXT[] DEFAULT '{}',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, org_id)
);

-- Teams
CREATE TABLE teams (
  team_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(org_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team memberships
CREATE TABLE team_memberships (
  team_id UUID REFERENCES teams(team_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- ============================================================================
-- GOALS & PROJECTS
-- ============================================================================

CREATE TABLE goals (
  goal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(org_id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(team_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('personal', 'professional', 'team', 'org')),
  target_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(org_id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(team_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- REQUEST PROCESSING
-- ============================================================================

CREATE TABLE requests (
  request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(org_id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(team_id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  channel TEXT CHECK (channel IN ('web', 'mobile', 'voice', 'api')),
  raw_input JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE classified_requests (
  request_id UUID PRIMARY KEY REFERENCES requests(request_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(org_id) ON DELETE CASCADE,
  normalized_text TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  preferred_language TEXT DEFAULT 'en',
  ui_locale TEXT DEFAULT 'en-US',
  domain TEXT NOT NULL,
  intent TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  sensitivity TEXT DEFAULT 'internal' CHECK (sensitivity IN ('public', 'internal', 'confidential')),
  safety_flags TEXT[] DEFAULT '{}',
  requires_inner_court BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE task_plans (
  plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES requests(request_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(org_id) ON DELETE CASCADE,
  high_level_goal TEXT NOT NULL,
  required_capabilities TEXT[] DEFAULT '{}',
  target_priests TEXT[] DEFAULT '{}',
  estimated_complexity TEXT CHECK (estimated_complexity IN ('low', 'medium', 'high')),
  needs_alignment_review BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subtasks (
  subtask_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES task_plans(plan_id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  assigned_priest TEXT NOT NULL,
  inputs JSONB DEFAULT '{}',
  outputs JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE final_responses (
  response_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES requests(request_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(org_id) ON DELETE CASCADE,
  user_facing_text TEXT NOT NULL,
  structured_output JSONB,
  explanations JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MEMORY & KNOWLEDGE
-- ============================================================================

CREATE TABLE memory_items (
  memory_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(org_id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(team_id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('fact', 'preference', 'decision', 'plan', 'summary', 'insight')),
  content TEXT NOT NULL,
  embedding_vector vector(1536), -- OpenAI ada-002 dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX memory_items_embedding_idx ON memory_items
USING ivfflat (embedding_vector vector_cosine_ops)
WITH (lists = 100);

-- Regular indexes
CREATE INDEX memory_items_user_id_idx ON memory_items(user_id);
CREATE INDEX memory_items_org_id_idx ON memory_items(org_id);
CREATE INDEX memory_items_team_id_idx ON memory_items(team_id);
CREATE INDEX memory_items_type_idx ON memory_items(type);

CREATE TABLE knowledge_snippets (
  snippet_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(org_id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(team_id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding_vector vector(1536),
  relevance_score FLOAT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX knowledge_snippets_embedding_idx ON knowledge_snippets
USING ivfflat (embedding_vector vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX knowledge_snippets_org_id_idx ON knowledge_snippets(org_id);
CREATE INDEX knowledge_snippets_team_id_idx ON knowledge_snippets(team_id);

-- ============================================================================
-- POLICIES & GOVERNANCE (ARK)
-- ============================================================================

CREATE TABLE policies (
  policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(org_id) ON DELETE CASCADE, -- null = global policy
  name TEXT NOT NULL,
  description TEXT,
  check_type TEXT CHECK (check_type IN ('pre', 'post')),
  match_criteria JSONB NOT NULL,
  handler_type TEXT CHECK (handler_type IN ('block', 'modify', 'warn', 'log')),
  config JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alignment_checks (
  check_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES requests(request_id) ON DELETE CASCADE,
  check_type TEXT CHECK (check_type IN ('pre', 'post')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  policies_evaluated UUID[] DEFAULT '{}',
  result JSONB NOT NULL,
  original_content TEXT,
  modified_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ACTIONS (RIVER)
-- ============================================================================

CREATE TABLE actions (
  action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES requests(request_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(org_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  target_system TEXT NOT NULL,
  payload JSONB NOT NULL,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- OBSERVABILITY & LOGGING
-- ============================================================================

CREATE TABLE service_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES requests(request_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(org_id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  log_level TEXT CHECK (log_level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX service_logs_request_id_idx ON service_logs(request_id);
CREATE INDEX service_logs_timestamp_idx ON service_logs(timestamp);

CREATE TABLE metrics (
  metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES requests(request_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(org_id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value FLOAT NOT NULL,
  unit TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX metrics_metric_name_idx ON metrics(metric_name);
CREATE INDEX metrics_timestamp_idx ON metrics(timestamp);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE classified_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE alignment_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- User profiles: users can see and update their own profile
CREATE POLICY user_profiles_select ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_profiles_update ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Orgs: users can see orgs they belong to
CREATE POLICY orgs_select ON orgs
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  );

-- User-Org relationships: users can see their own relationships
CREATE POLICY user_orgs_select ON user_orgs
  FOR SELECT USING (user_id = auth.uid());

-- Teams: users can see teams in their orgs or teams they're members of
CREATE POLICY teams_select ON teams
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid())
    OR team_id IN (SELECT team_id FROM team_memberships WHERE user_id = auth.uid())
  );

-- Team memberships: users can see memberships for teams they're in
CREATE POLICY team_memberships_select ON team_memberships
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_memberships WHERE user_id = auth.uid())
  );

-- Goals: users can see their own goals, team goals, and org goals
CREATE POLICY goals_select ON goals
  FOR SELECT USING (
    user_id = auth.uid()
    OR team_id IN (SELECT team_id FROM team_memberships WHERE user_id = auth.uid())
    OR org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY goals_insert ON goals
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR team_id IN (SELECT team_id FROM team_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY goals_update ON goals
  FOR UPDATE USING (
    user_id = auth.uid()
    OR team_id IN (SELECT team_id FROM team_memberships WHERE user_id = auth.uid())
  );

-- Projects: similar to goals
CREATE POLICY projects_select ON projects
  FOR SELECT USING (
    user_id = auth.uid()
    OR team_id IN (SELECT team_id FROM team_memberships WHERE user_id = auth.uid())
    OR org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid())
  );

-- Requests: users can only see their own requests
CREATE POLICY requests_select ON requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY requests_insert ON requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Classified requests: users can only see their own
CREATE POLICY classified_requests_select ON classified_requests
  FOR SELECT USING (user_id = auth.uid());

-- Task plans: users can only see their own
CREATE POLICY task_plans_select ON task_plans
  FOR SELECT USING (user_id = auth.uid());

-- Subtasks: users can see subtasks for their task plans
CREATE POLICY subtasks_select ON subtasks
  FOR SELECT USING (
    plan_id IN (SELECT plan_id FROM task_plans WHERE user_id = auth.uid())
  );

-- Final responses: users can only see their own
CREATE POLICY final_responses_select ON final_responses
  FOR SELECT USING (user_id = auth.uid());

-- Memory items: context-dependent visibility
CREATE POLICY memory_items_select ON memory_items
  FOR SELECT USING (
    user_id = auth.uid()
    OR team_id IN (SELECT team_id FROM team_memberships WHERE user_id = auth.uid())
    OR org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY memory_items_insert ON memory_items
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR team_id IN (SELECT team_id FROM team_memberships WHERE user_id = auth.uid())
  );

-- Knowledge snippets: org and team scoped
CREATE POLICY knowledge_snippets_select ON knowledge_snippets
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_memberships WHERE user_id = auth.uid())
    OR org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid())
  );

-- Policies: org-scoped or global
CREATE POLICY policies_select ON policies
  FOR SELECT USING (
    org_id IS NULL -- global policies
    OR org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid())
  );

-- Actions: users can see their own actions
CREATE POLICY actions_select ON actions
  FOR SELECT USING (user_id = auth.uid());

-- Service logs: users can see logs for their requests
CREATE POLICY service_logs_select ON service_logs
  FOR SELECT USING (
    request_id IN (SELECT request_id FROM requests WHERE user_id = auth.uid())
  );

-- Metrics: users can see metrics for their requests
CREATE POLICY metrics_select ON metrics
  FOR SELECT USING (
    request_id IN (SELECT request_id FROM requests WHERE user_id = auth.uid())
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_orgs_updated_at BEFORE UPDATE ON orgs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subtasks_updated_at BEFORE UPDATE ON subtasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memory_items_updated_at BEFORE UPDATE ON memory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_snippets_updated_at BEFORE UPDATE ON knowledge_snippets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actions_updated_at BEFORE UPDATE ON actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA (Optional global policies)
-- ============================================================================

-- Insert a sample global policy for harmful content
INSERT INTO policies (org_id, name, description, check_type, match_criteria, handler_type, config, active)
VALUES (
  NULL,
  'Global Harmful Content Filter',
  'Blocks requests with harmful or dangerous content',
  'pre',
  '{"keywords": ["violence", "harm", "illegal"], "sensitivity_levels": ["confidential"]}'::jsonb,
  'block',
  '{"block_message": "This request contains content that violates our safety policies."}'::jsonb,
  true
);
