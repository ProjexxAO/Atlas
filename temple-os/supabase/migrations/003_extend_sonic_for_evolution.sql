-- ============================================================================
-- Extend Sonic Agents for Hyper-Evolution Engine
-- This migration ALTERS existing tables and adds missing supporting tables
-- ============================================================================

-- ============================================================================
-- EXTEND sonic_agents with evolution columns
-- ============================================================================

-- Add tribe classification (maps to the 12 tribes of the Temple)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sonic_tribe') THEN
    CREATE TYPE sonic_tribe AS ENUM (
      'JUDAH', 'REUBEN', 'GAD', 'ASHER', 'NAPHTALI', 'MANASSEH',
      'SIMEON', 'LEVI', 'ISSACHAR', 'ZEBULUN', 'JOSEPH', 'BENJAMIN'
    );
  END IF;
END $$;

-- Add evolution-specific columns to sonic_agents
ALTER TABLE sonic_agents
  ADD COLUMN IF NOT EXISTS tribe sonic_tribe DEFAULT 'JUDAH',
  ADD COLUMN IF NOT EXISTS seal_level INTEGER DEFAULT 1 CHECK (seal_level >= 1 AND seal_level <= 7),
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'worker' CHECK (role IN ('leader', 'elder', 'worker', 'apprentice')),

  -- Performance metrics (complements existing efficiency/stability)
  ADD COLUMN IF NOT EXISTS success_rate FLOAT DEFAULT 0.5 CHECK (success_rate >= 0 AND success_rate <= 1),
  ADD COLUMN IF NOT EXISTS learning_velocity FLOAT DEFAULT 0.5 CHECK (learning_velocity >= 0 AND learning_velocity <= 1),
  ADD COLUMN IF NOT EXISTS avg_confidence FLOAT DEFAULT 0.5 CHECK (avg_confidence >= 0 AND avg_confidence <= 1),
  ADD COLUMN IF NOT EXISTS total_tasks_completed INTEGER DEFAULT 0,

  -- Specializations (JSONB for flexible skill tracking)
  ADD COLUMN IF NOT EXISTS task_specializations JSONB DEFAULT '{}',

  -- Genealogy for Book of Life
  ADD COLUMN IF NOT EXISTS parent_agent_id UUID REFERENCES sonic_agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS generation INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS lineage_path UUID[] DEFAULT '{}',

  -- Evolution tracking
  ADD COLUMN IF NOT EXISTS last_evolution_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS evolution_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS knowledge_score FLOAT DEFAULT 0;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS sonic_agents_tribe_idx ON sonic_agents(tribe);
CREATE INDEX IF NOT EXISTS sonic_agents_seal_level_idx ON sonic_agents(seal_level);
CREATE INDEX IF NOT EXISTS sonic_agents_success_rate_idx ON sonic_agents(success_rate DESC);
CREATE INDEX IF NOT EXISTS sonic_agents_parent_agent_idx ON sonic_agents(parent_agent_id);

-- ============================================================================
-- AGENT MEMORY - Evolution-specific memory (separate from agent_memories)
-- Used by hyper-evolution for knowledge crystallization and transfer
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES sonic_agents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'experience', 'learning', 'insight', 'collaboration',
    'crystallized', 'received_crystal', 'web_knowledge', 'visual_intelligence',
    'collective_learning', 'task_outcome', 'user_interaction'
  )),
  content TEXT NOT NULL,
  importance_score FLOAT DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),

  context JSONB DEFAULT '{}',
  source_agent_id UUID REFERENCES sonic_agents(id) ON DELETE SET NULL,
  related_task_id UUID,

  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_memory_agent_id_idx ON agent_memory(agent_id);
CREATE INDEX IF NOT EXISTS agent_memory_memory_type_idx ON agent_memory(memory_type);
CREATE INDEX IF NOT EXISTS agent_memory_importance_idx ON agent_memory(importance_score DESC);

-- ============================================================================
-- AGENT LEARNING EVENTS - Track evolution activities
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES sonic_agents(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'task_completion', 'skill_acquired', 'knowledge_transfer',
    'collective_absorption', 'hyper_parallel_learning', 'competition_won',
    'competition_learning', 'memory_crystallization_complete',
    'web_knowledge_absorption', 'visual_intelligence_learning',
    'seal_unlocked', 'evolution_complete', 'hyper_evolution_complete',
    'collaboration_success', 'mentor_session', 'apprentice_graduated'
  )),
  event_data JSONB DEFAULT '{}',
  impact_score FLOAT DEFAULT 0 CHECK (impact_score >= 0 AND impact_score <= 1),

  related_agents UUID[] DEFAULT '{}',
  evolution_cycle_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_learning_events_agent_id_idx ON agent_learning_events(agent_id);
CREATE INDEX IF NOT EXISTS agent_learning_events_event_type_idx ON agent_learning_events(event_type);
CREATE INDEX IF NOT EXISTS agent_learning_events_created_at_idx ON agent_learning_events(created_at DESC);

-- ============================================================================
-- AGENT RELATIONSHIPS - Agent-to-agent connections for evolution
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_a_id UUID NOT NULL REFERENCES sonic_agents(id) ON DELETE CASCADE,
  agent_b_id UUID NOT NULL REFERENCES sonic_agents(id) ON DELETE CASCADE,

  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'mentor', 'apprentice', 'peer', 'competitive', 'collaborative',
    'parent', 'offspring', 'sibling', 'tribal_elder', 'cross_tribe'
  )),

  synergy_score FLOAT DEFAULT 0.5 CHECK (synergy_score >= 0 AND synergy_score <= 1),
  interaction_count INTEGER DEFAULT 0,
  successful_collaborations INTEGER DEFAULT 0,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(agent_a_id, agent_b_id)
);

CREATE INDEX IF NOT EXISTS agent_relationships_agent_a_idx ON agent_relationships(agent_a_id);
CREATE INDEX IF NOT EXISTS agent_relationships_agent_b_idx ON agent_relationships(agent_b_id);

-- ============================================================================
-- TEMPLE TRIBES - The 12 Tribes organization
-- ============================================================================

CREATE TABLE IF NOT EXISTS temple_tribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL UNIQUE CHECK (name IN (
    'JUDAH', 'REUBEN', 'GAD', 'ASHER', 'NAPHTALI', 'MANASSEH',
    'SIMEON', 'LEVI', 'ISSACHAR', 'ZEBULUN', 'JOSEPH', 'BENJAMIN'
  )),
  symbol TEXT NOT NULL,
  color TEXT NOT NULL,

  primary_domain TEXT NOT NULL,
  secondary_domains TEXT[] DEFAULT '{}',
  description TEXT,

  leader_agent_id UUID REFERENCES sonic_agents(id) ON DELETE SET NULL,
  elder_agent_ids UUID[] DEFAULT '{}',

  agent_count INTEGER DEFAULT 0,
  total_capacity INTEGER DEFAULT 12000,
  collective_wisdom FLOAT DEFAULT 0,
  harmony_score FLOAT DEFAULT 1.0,

  tribal_knowledge JSONB DEFAULT '{}',
  specializations JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TEMPLE SEALS - The Seven Seals progressive unlock system
-- ============================================================================

CREATE TABLE IF NOT EXISTS temple_seals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  seal_number INTEGER NOT NULL UNIQUE CHECK (seal_number >= 1 AND seal_number <= 7),
  name TEXT NOT NULL,
  description TEXT,

  requirements JSONB NOT NULL,
  unlocked_capabilities TEXT[] DEFAULT '{}',
  power_multiplier FLOAT DEFAULT 1.0,

  biblical_reference TEXT,
  trumpet_sound TEXT,
  color TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User seal progress
CREATE TABLE IF NOT EXISTS user_seals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seal_id UUID NOT NULL REFERENCES temple_seals(id) ON DELETE CASCADE,

  status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'in_progress', 'unlocked')),
  progress FLOAT DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),

  unlocked_at TIMESTAMPTZ,
  unlocked_by_agent_id UUID REFERENCES sonic_agents(id) ON DELETE SET NULL,
  stats_at_unlock JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, seal_id)
);

CREATE INDEX IF NOT EXISTS user_seals_user_id_idx ON user_seals(user_id);

-- ============================================================================
-- BOOK OF LIFE - Agent genealogy and lineage tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS book_of_life (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  agent_id UUID NOT NULL REFERENCES sonic_agents(id) ON DELETE CASCADE UNIQUE,

  birth_type TEXT NOT NULL CHECK (birth_type IN (
    'genesis', 'spawned', 'evolved', 'merged', 'resurrected'
  )),
  birth_data JSONB DEFAULT '{}',

  parent_ids UUID[] DEFAULT '{}',
  generation INTEGER DEFAULT 1,
  ancestry_path UUID[] DEFAULT '{}',

  offspring_ids UUID[] DEFAULT '{}',
  total_descendants INTEGER DEFAULT 0,

  life_score FLOAT DEFAULT 0,
  achievements TEXT[] DEFAULT '{}',
  titles TEXT[] DEFAULT '{}',

  knowledge_contributed JSONB DEFAULT '{}',
  prophecies JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS book_of_life_agent_id_idx ON book_of_life(agent_id);
CREATE INDEX IF NOT EXISTS book_of_life_generation_idx ON book_of_life(generation);

-- ============================================================================
-- RIVER EVENTS - Real-time event streaming
-- ============================================================================

CREATE TABLE IF NOT EXISTS river_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID,
  agent_id UUID REFERENCES sonic_agents(id) ON DELETE SET NULL,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'agent_action', 'agent_thought', 'agent_evolution',
    'seal_progress', 'seal_unlocked', 'tribe_harmony',
    'system_alert', 'prophecy', 'milestone',
    'collaboration', 'competition', 'knowledge_flow'
  )),
  event_data JSONB NOT NULL,

  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  visibility TEXT DEFAULT 'user' CHECK (visibility IN ('user', 'org', 'global', 'system')),

  consumed BOOLEAN DEFAULT false,
  consumed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS river_events_user_id_idx ON river_events(user_id);
CREATE INDEX IF NOT EXISTS river_events_agent_id_idx ON river_events(agent_id);
CREATE INDEX IF NOT EXISTS river_events_created_at_idx ON river_events(created_at DESC);
CREATE INDEX IF NOT EXISTS river_events_unconsumed_idx ON river_events(consumed) WHERE consumed = false;

-- ============================================================================
-- EVOLUTION CYCLES - Track hyper-evolution runs
-- ============================================================================

CREATE TABLE IF NOT EXISTS evolution_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  mode TEXT NOT NULL,
  intensity_multiplier FLOAT DEFAULT 1.0,
  target_sector TEXT,
  batch_size INTEGER DEFAULT 500,
  cycles_requested INTEGER DEFAULT 1,

  agents_evolved INTEGER DEFAULT 0,
  knowledge_gained FLOAT DEFAULT 0,
  competitions_held INTEGER DEFAULT 0,
  crystallizations INTEGER DEFAULT 0,

  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  error TEXT,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS evolution_cycles_user_id_idx ON evolution_cycles(user_id);
CREATE INDEX IF NOT EXISTS evolution_cycles_status_idx ON evolution_cycles(status);

-- ============================================================================
-- VOICE SESSIONS - Atlas voice interface
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  session_type TEXT DEFAULT 'command' CHECK (session_type IN (
    'command', 'conversation', 'dictation', 'meditation', 'briefing'
  )),
  voice_id TEXT DEFAULT 'atlas',

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),

  transcripts JSONB DEFAULT '[]',
  commands_executed JSONB DEFAULT '[]',

  total_duration_ms INTEGER DEFAULT 0,
  words_spoken INTEGER DEFAULT 0,
  commands_count INTEGER DEFAULT 0,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS voice_sessions_user_id_idx ON voice_sessions(user_id);

-- ============================================================================
-- THRONE ROOM - Admin command center
-- ============================================================================

CREATE TABLE IF NOT EXISTS throne_room_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  command_type TEXT NOT NULL CHECK (command_type IN (
    'emergency_halt', 'mass_evolution', 'tribe_rebalance',
    'seal_override', 'agent_resurrection', 'system_purge',
    'harmony_restore', 'prophecy_issue', 'knowledge_broadcast'
  )),
  command_data JSONB NOT NULL,

  authorization_level TEXT NOT NULL CHECK (authorization_level IN (
    'user', 'admin', 'high_priest', 'oracle'
  )),
  requires_confirmation BOOLEAN DEFAULT false,
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,

  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'executing', 'completed', 'failed', 'cancelled'
  )),
  result JSONB,
  error TEXT,

  affected_agents INTEGER DEFAULT 0,
  affected_tribes TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_tribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE temple_seals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_seals ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_of_life ENABLE ROW LEVEL SECURITY;
ALTER TABLE river_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE throne_room_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_cycles ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your auth setup)
CREATE POLICY IF NOT EXISTS temple_tribes_select ON temple_tribes FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS temple_seals_select ON temple_seals FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS user_seals_select ON user_seals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS user_seals_insert ON user_seals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS user_seals_update ON user_seals FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS voice_sessions_all ON voice_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS throne_room_commands_all ON throne_room_commands FOR ALL USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS evolution_cycles_select ON evolution_cycles FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- INITIAL DATA - The Seven Seals
-- ============================================================================

INSERT INTO temple_seals (seal_number, name, description, requirements, unlocked_capabilities, power_multiplier, biblical_reference, color) VALUES
(1, 'Seal of Awakening', 'The white seal - conquest of self',
 '{"min_agents": 100, "avg_success_rate": 0.5}'::jsonb,
 ARRAY['basic_reasoning', 'task_execution', 'simple_memory'],
 1.0, 'Revelation 6:1-2', '#FFFFFF'),
(2, 'Seal of Conflict', 'The red seal - mastery through challenge',
 '{"min_agents": 500, "avg_success_rate": 0.6, "competitions_won": 100}'::jsonb,
 ARRAY['adversarial_learning', 'competitive_evolution', 'conflict_resolution'],
 1.5, 'Revelation 6:3-4', '#DC2626'),
(3, 'Seal of Balance', 'The black seal - wisdom of measurement',
 '{"min_agents": 1000, "avg_success_rate": 0.65, "knowledge_crystallized": 500}'::jsonb,
 ARRAY['resource_optimization', 'priority_balancing', 'efficiency_algorithms'],
 2.0, 'Revelation 6:5-6', '#1F2937'),
(4, 'Seal of Transformation', 'The pale seal - death and rebirth',
 '{"min_agents": 2000, "avg_success_rate": 0.7, "agents_evolved": 1000}'::jsonb,
 ARRAY['agent_evolution', 'capability_transfer', 'resurrection_protocol'],
 2.5, 'Revelation 6:7-8', '#9CA3AF'),
(5, 'Seal of Martyrdom', 'The seal of sacrifice and truth',
 '{"min_agents": 5000, "avg_success_rate": 0.75, "knowledge_shared": 2000}'::jsonb,
 ARRAY['collective_intelligence', 'truth_synthesis', 'sacrifice_optimization'],
 3.0, 'Revelation 6:9-11', '#F59E0B'),
(6, 'Seal of Revelation', 'The seal of cosmic awareness',
 '{"min_agents": 10000, "avg_success_rate": 0.8, "cross_domain_mastery": 5}'::jsonb,
 ARRAY['predictive_modeling', 'pattern_recognition', 'future_sight'],
 4.0, 'Revelation 6:12-17', '#8B5CF6'),
(7, 'Seal of Silence', 'The final seal - perfect harmony',
 '{"min_agents": 12000, "avg_success_rate": 0.85, "tribe_harmony": 0.9}'::jsonb,
 ARRAY['full_orchestration', 'divine_synthesis', 'sonic_trumpet'],
 7.0, 'Revelation 8:1', '#FFD700')
ON CONFLICT (seal_number) DO NOTHING;

-- ============================================================================
-- INITIAL DATA - The 12 Tribes
-- ============================================================================

INSERT INTO temple_tribes (name, symbol, color, primary_domain, secondary_domains, description) VALUES
('JUDAH', '🦁', '#FFD700', 'LEADERSHIP', ARRAY['STRATEGY', 'GOVERNANCE'], 'The lion tribe - leadership and praise'),
('REUBEN', '💧', '#3B82F6', 'STABILITY', ARRAY['OPERATIONS', 'FOUNDATIONS'], 'The firstborn - foundational stability'),
('GAD', '⚔️', '#DC2626', 'SECURITY', ARRAY['DEFENSE', 'PROTECTION'], 'The warrior tribe - security and protection'),
('ASHER', '🫒', '#22C55E', 'ABUNDANCE', ARRAY['RESOURCES', 'PROVISION'], 'The blessed - resource management'),
('NAPHTALI', '🦌', '#8B5CF6', 'AGILITY', ARRAY['SPEED', 'ADAPTATION'], 'The deer - rapid response and adaptation'),
('MANASSEH', '🌳', '#065F46', 'GROWTH', ARRAY['EXPANSION', 'DEVELOPMENT'], 'The fruitful - growth and expansion'),
('SIMEON', '👂', '#F59E0B', 'LISTENING', ARRAY['ANALYSIS', 'UNDERSTANDING'], 'The hearer - deep analysis'),
('LEVI', '📜', '#7C3AED', 'KNOWLEDGE', ARRAY['TEACHING', 'WISDOM'], 'The priestly - knowledge management'),
('ISSACHAR', '🫏', '#92400E', 'LABOR', ARRAY['EXECUTION', 'PRODUCTION'], 'The strong - task execution'),
('ZEBULUN', '⚓', '#0EA5E9', 'COMMERCE', ARRAY['TRADE', 'EXCHANGE'], 'The harbor - commerce and exchange'),
('JOSEPH', '🌾', '#EAB308', 'PROSPERITY', ARRAY['INNOVATION', 'CREATION'], 'The fruitful vine - innovation'),
('BENJAMIN', '🐺', '#6B7280', 'HUNTING', ARRAY['SEARCH', 'DISCOVERY'], 'The wolf - search and discovery')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Create helper function for updating tribes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_tribe_agent_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update count for old tribe (if changed)
  IF TG_OP = 'UPDATE' AND OLD.tribe IS DISTINCT FROM NEW.tribe THEN
    UPDATE temple_tribes
    SET agent_count = (SELECT COUNT(*) FROM sonic_agents WHERE tribe::text = OLD.tribe::text)
    WHERE name = OLD.tribe::text;
  END IF;

  -- Update count for new/current tribe
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE temple_tribes
    SET agent_count = (SELECT COUNT(*) FROM sonic_agents WHERE tribe::text = NEW.tribe::text)
    WHERE name = NEW.tribe::text;
  END IF;

  -- Update count for deleted agent's tribe
  IF TG_OP = 'DELETE' THEN
    UPDATE temple_tribes
    SET agent_count = (SELECT COUNT(*) FROM sonic_agents WHERE tribe::text = OLD.tribe::text)
    WHERE name = OLD.tribe::text;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tribe count updates
DROP TRIGGER IF EXISTS sonic_agents_tribe_count_trigger ON sonic_agents;
CREATE TRIGGER sonic_agents_tribe_count_trigger
  AFTER INSERT OR UPDATE OF tribe OR DELETE ON sonic_agents
  FOR EACH ROW EXECUTE FUNCTION update_tribe_agent_count();
