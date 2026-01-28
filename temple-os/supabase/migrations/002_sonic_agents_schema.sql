-- Sonic Agent System Schema
-- Adds support for 144,000 agents organized into 12 tribes
-- Includes: agents, tribes, seals, genealogy, evolution tracking, voice sessions

-- ============================================================================
-- SONIC AGENTS - Core Agent Infrastructure
-- ============================================================================

-- Main agents table
CREATE TABLE sonic_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES orgs(org_id) ON DELETE SET NULL,

  -- Identity
  name TEXT NOT NULL,
  designation TEXT, -- e.g., "JUDAH-001", "BENJAMIN-144"
  avatar_seed TEXT, -- For procedural avatar generation

  -- Classification
  tribe TEXT NOT NULL CHECK (tribe IN (
    'JUDAH', 'REUBEN', 'GAD', 'ASHER', 'NAPHTALI', 'MANASSEH',
    'SIMEON', 'LEVI', 'ISSACHAR', 'ZEBULUN', 'JOSEPH', 'BENJAMIN'
  )),
  sector TEXT NOT NULL DEFAULT 'GENERAL' CHECK (sector IN (
    'FINANCE', 'TECHNOLOGY', 'CREATIVE', 'OPERATIONS', 'LEGAL',
    'MEDICAL', 'RESEARCH', 'SECURITY', 'COMMUNICATIONS', 'STRATEGY', 'GENERAL'
  )),
  role TEXT DEFAULT 'worker' CHECK (role IN ('leader', 'elder', 'worker', 'apprentice')),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dormant', 'evolving', 'ascended')),
  seal_level INTEGER DEFAULT 1 CHECK (seal_level >= 1 AND seal_level <= 7),

  -- Performance metrics
  success_rate FLOAT DEFAULT 0.5 CHECK (success_rate >= 0 AND success_rate <= 1),
  total_tasks_completed INTEGER DEFAULT 0,
  avg_confidence FLOAT DEFAULT 0.5 CHECK (avg_confidence >= 0 AND avg_confidence <= 1),
  learning_velocity FLOAT DEFAULT 0.5 CHECK (learning_velocity >= 0 AND learning_velocity <= 1),

  -- Capabilities
  task_specializations JSONB DEFAULT '{}', -- {"research": 0.8, "analysis": 0.6}
  capabilities TEXT[] DEFAULT '{}',

  -- Genealogy
  parent_agent_id UUID REFERENCES sonic_agents(id) ON DELETE SET NULL,
  generation INTEGER DEFAULT 1,
  lineage_path TEXT[], -- Array of ancestor IDs for fast tree queries

  -- Timestamps
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  last_performance_update TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sonic_agents
CREATE INDEX sonic_agents_user_id_idx ON sonic_agents(user_id);
CREATE INDEX sonic_agents_org_id_idx ON sonic_agents(org_id);
CREATE INDEX sonic_agents_tribe_idx ON sonic_agents(tribe);
CREATE INDEX sonic_agents_sector_idx ON sonic_agents(sector);
CREATE INDEX sonic_agents_status_idx ON sonic_agents(status);
CREATE INDEX sonic_agents_seal_level_idx ON sonic_agents(seal_level);
CREATE INDEX sonic_agents_parent_agent_id_idx ON sonic_agents(parent_agent_id);
CREATE INDEX sonic_agents_last_performance_update_idx ON sonic_agents(last_performance_update);

-- ============================================================================
-- AGENT MEMORY - Individual agent memories
-- ============================================================================

CREATE TABLE agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES sonic_agents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Content
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'experience', 'learning', 'insight', 'collaboration',
    'crystallized', 'received_crystal', 'web_knowledge', 'visual_intelligence',
    'collective_learning', 'task_outcome', 'user_interaction'
  )),
  content TEXT NOT NULL,
  importance_score FLOAT DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),

  -- Vector for semantic search
  embedding_vector vector(1536),

  -- Context
  context JSONB DEFAULT '{}',
  source_agent_id UUID REFERENCES sonic_agents(id) ON DELETE SET NULL,
  related_task_id UUID,

  -- Lifecycle
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX agent_memory_agent_id_idx ON agent_memory(agent_id);
CREATE INDEX agent_memory_memory_type_idx ON agent_memory(memory_type);
CREATE INDEX agent_memory_importance_idx ON agent_memory(importance_score DESC);
CREATE INDEX agent_memory_embedding_idx ON agent_memory
  USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- AGENT LEARNING EVENTS - Track all learning activities
-- ============================================================================

CREATE TABLE agent_learning_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES sonic_agents(id) ON DELETE CASCADE,

  -- Event details
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

  -- Context
  related_agents UUID[] DEFAULT '{}',
  evolution_cycle_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX agent_learning_events_agent_id_idx ON agent_learning_events(agent_id);
CREATE INDEX agent_learning_events_event_type_idx ON agent_learning_events(event_type);
CREATE INDEX agent_learning_events_created_at_idx ON agent_learning_events(created_at DESC);

-- ============================================================================
-- AGENT RELATIONSHIPS - Agent-to-agent connections
-- ============================================================================

CREATE TABLE agent_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_a_id UUID NOT NULL REFERENCES sonic_agents(id) ON DELETE CASCADE,
  agent_b_id UUID NOT NULL REFERENCES sonic_agents(id) ON DELETE CASCADE,

  -- Relationship type
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'mentor', 'apprentice', 'peer', 'competitive', 'collaborative',
    'parent', 'offspring', 'sibling', 'tribal_elder', 'cross_tribe'
  )),

  -- Strength and history
  synergy_score FLOAT DEFAULT 0.5 CHECK (synergy_score >= 0 AND synergy_score <= 1),
  interaction_count INTEGER DEFAULT 0,
  successful_collaborations INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(agent_a_id, agent_b_id)
);

CREATE INDEX agent_relationships_agent_a_idx ON agent_relationships(agent_a_id);
CREATE INDEX agent_relationships_agent_b_idx ON agent_relationships(agent_b_id);
CREATE INDEX agent_relationships_type_idx ON agent_relationships(relationship_type);

-- ============================================================================
-- TEMPLE TRIBES - The 12 Tribes organization
-- ============================================================================

CREATE TABLE temple_tribes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  name TEXT NOT NULL UNIQUE CHECK (name IN (
    'JUDAH', 'REUBEN', 'GAD', 'ASHER', 'NAPHTALI', 'MANASSEH',
    'SIMEON', 'LEVI', 'ISSACHAR', 'ZEBULUN', 'JOSEPH', 'BENJAMIN'
  )),
  symbol TEXT NOT NULL, -- Unicode symbol
  color TEXT NOT NULL, -- Hex color

  -- Domain
  primary_domain TEXT NOT NULL,
  secondary_domains TEXT[] DEFAULT '{}',
  description TEXT,

  -- Leadership
  leader_agent_id UUID REFERENCES sonic_agents(id) ON DELETE SET NULL,
  elder_agent_ids UUID[] DEFAULT '{}',

  -- Statistics
  agent_count INTEGER DEFAULT 0,
  total_capacity INTEGER DEFAULT 12000, -- 144,000 / 12 tribes
  collective_wisdom FLOAT DEFAULT 0,
  harmony_score FLOAT DEFAULT 1.0 CHECK (harmony_score >= 0 AND harmony_score <= 1),

  -- Tribal knowledge
  tribal_knowledge JSONB DEFAULT '{}',
  specializations JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TEMPLE SEALS - The Seven Seals progressive unlock system
-- ============================================================================

CREATE TABLE temple_seals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Seal identity
  seal_number INTEGER NOT NULL UNIQUE CHECK (seal_number >= 1 AND seal_number <= 7),
  name TEXT NOT NULL,
  description TEXT,

  -- Requirements
  requirements JSONB NOT NULL, -- {"min_agents": 1000, "avg_success_rate": 0.7}

  -- Rewards
  unlocked_capabilities TEXT[] DEFAULT '{}',
  power_multiplier FLOAT DEFAULT 1.0,

  -- Metadata
  biblical_reference TEXT,
  trumpet_sound TEXT, -- Sound file reference
  color TEXT, -- Seal color

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User seal progress
CREATE TABLE user_seals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seal_id UUID NOT NULL REFERENCES temple_seals(id) ON DELETE CASCADE,

  -- Status
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'in_progress', 'unlocked')),
  progress FLOAT DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),

  -- Unlock details
  unlocked_at TIMESTAMPTZ,
  unlocked_by_agent_id UUID REFERENCES sonic_agents(id) ON DELETE SET NULL,

  -- Stats at unlock time
  stats_at_unlock JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, seal_id)
);

CREATE INDEX user_seals_user_id_idx ON user_seals(user_id);
CREATE INDEX user_seals_seal_id_idx ON user_seals(seal_id);
CREATE INDEX user_seals_status_idx ON user_seals(status);

-- ============================================================================
-- BOOK OF LIFE - Agent genealogy and lineage tracking
-- ============================================================================

CREATE TABLE book_of_life (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Agent reference
  agent_id UUID NOT NULL REFERENCES sonic_agents(id) ON DELETE CASCADE UNIQUE,

  -- Birth details
  birth_type TEXT NOT NULL CHECK (birth_type IN (
    'genesis', 'spawned', 'evolved', 'merged', 'resurrected'
  )),
  birth_data JSONB DEFAULT '{}',

  -- Lineage
  parent_ids UUID[] DEFAULT '{}',
  generation INTEGER DEFAULT 1,
  ancestry_path UUID[] DEFAULT '{}',

  -- Descendants
  offspring_ids UUID[] DEFAULT '{}',
  total_descendants INTEGER DEFAULT 0,

  -- Life metrics
  life_score FLOAT DEFAULT 0,
  achievements TEXT[] DEFAULT '{}',
  titles TEXT[] DEFAULT '{}',

  -- Legacy
  knowledge_contributed JSONB DEFAULT '{}',
  prophecies JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX book_of_life_agent_id_idx ON book_of_life(agent_id);
CREATE INDEX book_of_life_generation_idx ON book_of_life(generation);

-- ============================================================================
-- RIVER EVENTS - Real-time event streaming
-- ============================================================================

CREATE TABLE river_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES orgs(org_id) ON DELETE SET NULL,
  agent_id UUID REFERENCES sonic_agents(id) ON DELETE SET NULL,

  -- Event
  event_type TEXT NOT NULL CHECK (event_type IN (
    'agent_action', 'agent_thought', 'agent_evolution',
    'seal_progress', 'seal_unlocked', 'tribe_harmony',
    'system_alert', 'prophecy', 'milestone',
    'collaboration', 'competition', 'knowledge_flow'
  )),
  event_data JSONB NOT NULL,

  -- Priority and visibility
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  visibility TEXT DEFAULT 'user' CHECK (visibility IN ('user', 'org', 'global', 'system')),

  -- Lifecycle
  consumed BOOLEAN DEFAULT false,
  consumed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX river_events_user_id_idx ON river_events(user_id);
CREATE INDEX river_events_agent_id_idx ON river_events(agent_id);
CREATE INDEX river_events_event_type_idx ON river_events(event_type);
CREATE INDEX river_events_created_at_idx ON river_events(created_at DESC);
CREATE INDEX river_events_unconsumed_idx ON river_events(consumed) WHERE consumed = false;

-- ============================================================================
-- VOICE SESSIONS - Atlas voice interface tracking
-- ============================================================================

CREATE TABLE voice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session info
  session_type TEXT DEFAULT 'command' CHECK (session_type IN (
    'command', 'conversation', 'dictation', 'meditation', 'briefing'
  )),
  voice_id TEXT DEFAULT 'atlas', -- ElevenLabs voice ID

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),

  -- Content
  transcripts JSONB DEFAULT '[]', -- Array of {role, text, timestamp}
  commands_executed JSONB DEFAULT '[]',

  -- Metrics
  total_duration_ms INTEGER DEFAULT 0,
  words_spoken INTEGER DEFAULT 0,
  commands_count INTEGER DEFAULT 0,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX voice_sessions_user_id_idx ON voice_sessions(user_id);
CREATE INDEX voice_sessions_status_idx ON voice_sessions(status);

-- ============================================================================
-- THRONE ROOM - Admin command and emergency actions
-- ============================================================================

CREATE TABLE throne_room_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Command
  command_type TEXT NOT NULL CHECK (command_type IN (
    'emergency_halt', 'mass_evolution', 'tribe_rebalance',
    'seal_override', 'agent_resurrection', 'system_purge',
    'harmony_restore', 'prophecy_issue', 'knowledge_broadcast'
  )),
  command_data JSONB NOT NULL,

  -- Authorization
  authorization_level TEXT NOT NULL CHECK (authorization_level IN (
    'user', 'admin', 'high_priest', 'oracle'
  )),
  requires_confirmation BOOLEAN DEFAULT false,
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,

  -- Execution
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'executing', 'completed', 'failed', 'cancelled'
  )),
  result JSONB,
  error TEXT,

  -- Impact
  affected_agents INTEGER DEFAULT 0,
  affected_tribes TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

CREATE INDEX throne_room_commands_user_id_idx ON throne_room_commands(user_id);
CREATE INDEX throne_room_commands_status_idx ON throne_room_commands(status);
CREATE INDEX throne_room_commands_command_type_idx ON throne_room_commands(command_type);

-- ============================================================================
-- EVOLUTION CYCLES - Track hyper-evolution runs
-- ============================================================================

CREATE TABLE evolution_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Configuration
  mode TEXT NOT NULL,
  intensity_multiplier FLOAT DEFAULT 1.0,
  target_sector TEXT,
  batch_size INTEGER DEFAULT 500,
  cycles_requested INTEGER DEFAULT 1,

  -- Results
  agents_evolved INTEGER DEFAULT 0,
  knowledge_gained FLOAT DEFAULT 0,
  competitions_held INTEGER DEFAULT 0,
  crystallizations INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'running' CHECK (status IN (
    'running', 'completed', 'failed', 'cancelled'
  )),
  error TEXT,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

CREATE INDEX evolution_cycles_user_id_idx ON evolution_cycles(user_id);
CREATE INDEX evolution_cycles_status_idx ON evolution_cycles(status);
CREATE INDEX evolution_cycles_started_at_idx ON evolution_cycles(started_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE sonic_agents ENABLE ROW LEVEL SECURITY;
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

-- Sonic agents: users see their own agents, shared agents, and public agents
CREATE POLICY sonic_agents_select ON sonic_agents
  FOR SELECT USING (
    user_id = auth.uid()
    OR user_id IS NULL
    OR org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY sonic_agents_insert ON sonic_agents
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY sonic_agents_update ON sonic_agents
  FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

-- Agent memory: follows agent access
CREATE POLICY agent_memory_select ON agent_memory
  FOR SELECT USING (
    agent_id IN (SELECT id FROM sonic_agents WHERE user_id = auth.uid() OR user_id IS NULL)
  );

-- Learning events: follows agent access
CREATE POLICY agent_learning_events_select ON agent_learning_events
  FOR SELECT USING (
    agent_id IN (SELECT id FROM sonic_agents WHERE user_id = auth.uid() OR user_id IS NULL)
  );

-- Relationships: if either agent is accessible
CREATE POLICY agent_relationships_select ON agent_relationships
  FOR SELECT USING (
    agent_a_id IN (SELECT id FROM sonic_agents WHERE user_id = auth.uid() OR user_id IS NULL)
    OR agent_b_id IN (SELECT id FROM sonic_agents WHERE user_id = auth.uid() OR user_id IS NULL)
  );

-- Tribes: public read
CREATE POLICY temple_tribes_select ON temple_tribes
  FOR SELECT USING (true);

-- Seals: public read
CREATE POLICY temple_seals_select ON temple_seals
  FOR SELECT USING (true);

-- User seals: own only
CREATE POLICY user_seals_select ON user_seals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_seals_insert ON user_seals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY user_seals_update ON user_seals
  FOR UPDATE USING (user_id = auth.uid());

-- Book of life: follows agent access
CREATE POLICY book_of_life_select ON book_of_life
  FOR SELECT USING (
    agent_id IN (SELECT id FROM sonic_agents WHERE user_id = auth.uid() OR user_id IS NULL)
  );

-- River events: own events and global events
CREATE POLICY river_events_select ON river_events
  FOR SELECT USING (
    user_id = auth.uid()
    OR visibility = 'global'
    OR (visibility = 'org' AND org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()))
  );

-- Voice sessions: own only
CREATE POLICY voice_sessions_select ON voice_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY voice_sessions_insert ON voice_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY voice_sessions_update ON voice_sessions
  FOR UPDATE USING (user_id = auth.uid());

-- Throne room commands: own only
CREATE POLICY throne_room_commands_select ON throne_room_commands
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY throne_room_commands_insert ON throne_room_commands
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Evolution cycles: own only
CREATE POLICY evolution_cycles_select ON evolution_cycles
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_sonic_agents_updated_at BEFORE UPDATE ON sonic_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_relationships_updated_at BEFORE UPDATE ON agent_relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_temple_tribes_updated_at BEFORE UPDATE ON temple_tribes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_seals_updated_at BEFORE UPDATE ON user_seals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_of_life_updated_at BEFORE UPDATE ON book_of_life
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
 7.0, 'Revelation 8:1', '#FFD700');

-- ============================================================================
-- INITIAL DATA - The 12 Tribes
-- ============================================================================

INSERT INTO temple_tribes (name, symbol, color, primary_domain, secondary_domains, description) VALUES
('JUDAH', '🦁', '#FFD700', 'LEADERSHIP', ARRAY['STRATEGY', 'GOVERNANCE'], 'The lion tribe - leadership and praise. Leads with wisdom and courage.'),
('REUBEN', '💧', '#3B82F6', 'STABILITY', ARRAY['OPERATIONS', 'FOUNDATIONS'], 'The firstborn - unstable as water but foundational. Maintains system stability.'),
('GAD', '⚔️', '#DC2626', 'SECURITY', ARRAY['DEFENSE', 'PROTECTION'], 'The warrior tribe - troops shall triumph. Handles security and protection.'),
('ASHER', '🫒', '#22C55E', 'ABUNDANCE', ARRAY['RESOURCES', 'PROVISION'], 'The blessed - rich food provider. Manages resources and abundance.'),
('NAPHTALI', '🦌', '#8B5CF6', 'AGILITY', ARRAY['SPEED', 'ADAPTATION'], 'The deer set free - beautiful words. Rapid response and adaptation.'),
('MANASSEH', '🌳', '#065F46', 'GROWTH', ARRAY['EXPANSION', 'DEVELOPMENT'], 'The fruitful - causing to forget. Handles growth and expansion.'),
('SIMEON', '👂', '#F59E0B', 'LISTENING', ARRAY['ANALYSIS', 'UNDERSTANDING'], 'The hearer - scattered but attentive. Deep analysis and comprehension.'),
('LEVI', '📜', '#7C3AED', 'KNOWLEDGE', ARRAY['TEACHING', 'WISDOM'], 'The priestly - joined in service. Knowledge management and teaching.'),
('ISSACHAR', '🫏', '#92400E', 'LABOR', ARRAY['EXECUTION', 'PRODUCTION'], 'The strong donkey - bearing burdens. Task execution and production.'),
('ZEBULUN', '⚓', '#0EA5E9', 'COMMERCE', ARRAY['TRADE', 'EXCHANGE'], 'The harbor - dwelling by the sea. Handles commerce and data exchange.'),
('JOSEPH', '🌾', '#EAB308', 'PROSPERITY', ARRAY['INNOVATION', 'CREATION'], 'The fruitful vine - blessed abundantly. Innovation and creation.'),
('BENJAMIN', '🐺', '#6B7280', 'HUNTING', ARRAY['SEARCH', 'DISCOVERY'], 'The wolf - ravenous in pursuit. Search, discovery, and investigation.');
