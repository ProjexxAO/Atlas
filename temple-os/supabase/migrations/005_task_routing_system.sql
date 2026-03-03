-- ============================================================
-- TASK ROUTING SYSTEM — Sonic Agent Work Infrastructure
-- ============================================================
-- Migration 005: Enable agents to receive and complete tasks
-- ============================================================

-- Task status enum
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM (
    'PENDING',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Task priority enum
DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TASKS TABLE — Core task storage
-- ============================================================
CREATE TABLE IF NOT EXISTS sonic_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Task details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(100) NOT NULL,

  -- Routing requirements
  required_sector agent_sector,
  required_tribe sonic_tribe,
  required_class agent_class,
  min_success_rate DECIMAL(3,2) DEFAULT 0.5,
  required_skills JSONB DEFAULT '[]'::jsonb,

  -- Assignment
  assigned_agent_id UUID REFERENCES sonic_agents(id),
  assigned_at TIMESTAMPTZ,

  -- Status tracking
  status task_status DEFAULT 'PENDING',
  priority task_priority DEFAULT 'MEDIUM',

  -- Results
  result JSONB,
  confidence_score DECIMAL(3,2),
  completion_notes TEXT,

  -- Ownership
  user_id UUID,
  tenant_id UUID,

  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,

  -- Retry logic
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  last_error TEXT
);

-- ============================================================
-- TASK QUEUE — For batch processing
-- ============================================================
CREATE TABLE IF NOT EXISTS task_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES sonic_tasks(id) ON DELETE CASCADE,
  priority INT DEFAULT 50,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  locked_by VARCHAR(100),
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AGENT TASK HISTORY — Track agent performance
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES sonic_agents(id) ON DELETE CASCADE,
  task_id UUID REFERENCES sonic_tasks(id) ON DELETE CASCADE,

  -- Performance metrics
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  success BOOLEAN,
  confidence_score DECIMAL(3,2),

  -- Learning
  skills_used JSONB DEFAULT '[]'::jsonb,
  skills_gained JSONB DEFAULT '[]'::jsonb,
  experience_gained DECIMAL(5,2) DEFAULT 0,

  -- Context
  task_type VARCHAR(100),
  sector agent_sector,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AGENT AVAILABILITY — Track who's ready for work
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_availability (
  agent_id UUID PRIMARY KEY REFERENCES sonic_agents(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT TRUE,
  current_task_id UUID REFERENCES sonic_tasks(id),
  tasks_in_progress INT DEFAULT 0,
  max_concurrent_tasks INT DEFAULT 3,
  last_task_completed_at TIMESTAMPTZ,
  total_tasks_today INT DEFAULT 0,
  daily_task_limit INT DEFAULT 100,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize availability for all existing agents
INSERT INTO agent_availability (agent_id, is_available)
SELECT id, TRUE FROM sonic_agents
ON CONFLICT (agent_id) DO NOTHING;

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tasks_status ON sonic_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_sector ON sonic_tasks(required_sector);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON sonic_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON sonic_tasks(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON sonic_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_scheduled ON task_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_queue_priority ON task_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_history_agent ON agent_task_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_history_task ON agent_task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_availability_available ON agent_availability(is_available) WHERE is_available = TRUE;

-- ============================================================
-- FUNCTION: Find best agent for a task
-- ============================================================
CREATE OR REPLACE FUNCTION find_best_agent(
  p_sector agent_sector DEFAULT NULL,
  p_tribe sonic_tribe DEFAULT NULL,
  p_class agent_class DEFAULT NULL,
  p_min_success DECIMAL DEFAULT 0.5,
  p_required_skills JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_agent_id UUID;
BEGIN
  SELECT sa.id INTO v_agent_id
  FROM sonic_agents sa
  JOIN agent_availability aa ON aa.agent_id = sa.id
  WHERE aa.is_available = TRUE
    AND aa.tasks_in_progress < aa.max_concurrent_tasks
    AND aa.total_tasks_today < aa.daily_task_limit
    AND sa.status = 'ACTIVE'
    AND sa.success_rate >= p_min_success
    AND (p_sector IS NULL OR sa.sector = p_sector)
    AND (p_tribe IS NULL OR sa.tribe = p_tribe)
    AND (p_class IS NULL OR sa.class = p_class)
  ORDER BY
    sa.success_rate DESC,
    sa.learning_velocity DESC,
    aa.last_task_completed_at ASC NULLS FIRST
  LIMIT 1;

  RETURN v_agent_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Assign task to agent
-- ============================================================
CREATE OR REPLACE FUNCTION assign_task_to_agent(
  p_task_id UUID,
  p_agent_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_success BOOLEAN := FALSE;
BEGIN
  -- Update task
  UPDATE sonic_tasks
  SET
    assigned_agent_id = p_agent_id,
    assigned_at = NOW(),
    status = 'ASSIGNED'
  WHERE id = p_task_id
    AND status = 'PENDING';

  IF FOUND THEN
    -- Update agent availability
    UPDATE agent_availability
    SET
      tasks_in_progress = tasks_in_progress + 1,
      current_task_id = p_task_id,
      is_available = (tasks_in_progress + 1 < max_concurrent_tasks),
      updated_at = NOW()
    WHERE agent_id = p_agent_id;

    v_success := TRUE;
  END IF;

  RETURN v_success;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Complete task
-- ============================================================
CREATE OR REPLACE FUNCTION complete_task(
  p_task_id UUID,
  p_success BOOLEAN,
  p_result JSONB DEFAULT NULL,
  p_confidence DECIMAL DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_agent_id UUID;
  v_started_at TIMESTAMPTZ;
  v_duration_ms INT;
  v_task_type VARCHAR(100);
  v_sector agent_sector;
BEGIN
  -- Get task info
  SELECT assigned_agent_id, started_at, task_type, required_sector
  INTO v_agent_id, v_started_at, v_task_type, v_sector
  FROM sonic_tasks
  WHERE id = p_task_id;

  IF v_agent_id IS NULL THEN
    RETURN FALSE;
  END IF;

  v_duration_ms := EXTRACT(EPOCH FROM (NOW() - COALESCE(v_started_at, NOW()))) * 1000;

  -- Update task
  UPDATE sonic_tasks
  SET
    status = CASE WHEN p_success THEN 'COMPLETED' ELSE 'FAILED' END,
    result = p_result,
    confidence_score = p_confidence,
    completion_notes = p_notes,
    completed_at = NOW()
  WHERE id = p_task_id;

  -- Record history
  INSERT INTO agent_task_history (
    agent_id, task_id, started_at, completed_at, duration_ms,
    success, confidence_score, task_type, sector
  ) VALUES (
    v_agent_id, p_task_id, v_started_at, NOW(), v_duration_ms,
    p_success, p_confidence, v_task_type, v_sector
  );

  -- Update agent availability
  UPDATE agent_availability
  SET
    tasks_in_progress = GREATEST(0, tasks_in_progress - 1),
    is_available = TRUE,
    current_task_id = NULL,
    last_task_completed_at = NOW(),
    total_tasks_today = total_tasks_today + 1,
    updated_at = NOW()
  WHERE agent_id = v_agent_id;

  -- Update agent stats
  UPDATE sonic_agents
  SET
    total_tasks_completed = total_tasks_completed + 1,
    success_rate = (success_rate * total_tasks_completed + (CASE WHEN p_success THEN 1 ELSE 0 END)) / (total_tasks_completed + 1),
    avg_confidence = CASE
      WHEN p_confidence IS NOT NULL THEN (avg_confidence * total_tasks_completed + p_confidence) / (total_tasks_completed + 1)
      ELSE avg_confidence
    END,
    last_performance_update = NOW()
  WHERE id = v_agent_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VIEW: Available agents summary
-- ============================================================
CREATE OR REPLACE VIEW available_agents_summary AS
SELECT
  sa.tribe,
  sa.sector,
  COUNT(*) FILTER (WHERE aa.is_available) as available_count,
  COUNT(*) as total_count,
  ROUND(AVG(sa.success_rate)::numeric, 3) as avg_success_rate,
  SUM(aa.tasks_in_progress) as tasks_in_progress
FROM sonic_agents sa
JOIN agent_availability aa ON aa.agent_id = sa.id
WHERE sa.status = 'ACTIVE'
GROUP BY sa.tribe, sa.sector;

-- ============================================================
-- VIEW: Task queue status
-- ============================================================
CREATE OR REPLACE VIEW task_queue_status AS
SELECT
  status,
  priority,
  required_sector,
  COUNT(*) as task_count,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_age_seconds
FROM sonic_tasks
GROUP BY status, priority, required_sector;
