-- ============================================================
-- Migration: 004_hyper_evolution_v2_tables.sql
-- Description: Add tables for Hyper-Evolution Engine v2
-- ============================================================
-- New tables:
--   - user_quotas: Per-user API quotas and limits
--   - evolution_jobs: Background job scheduling
--   - agent_billing_events: API usage billing tracking
-- New columns on sonic_agents:
--   - voice_id: ElevenLabs voice ID for voice synthesis
--   - atlas_identity_score: Self-identity evolution score
-- ============================================================

-- ============================================================
-- SECTION 1: Add new columns to sonic_agents
-- ============================================================

-- Add voice_id for ElevenLabs integration
ALTER TABLE sonic_agents
ADD COLUMN IF NOT EXISTS voice_id TEXT DEFAULT NULL;

-- Add atlas_identity_score for self-identity evolution
ALTER TABLE sonic_agents
ADD COLUMN IF NOT EXISTS atlas_identity_score NUMERIC DEFAULT 0;

-- Add index for voice_id lookups
CREATE INDEX IF NOT EXISTS idx_sonic_agents_voice_id
ON sonic_agents(voice_id) WHERE voice_id IS NOT NULL;

-- ============================================================
-- SECTION 2: User Quotas Table
-- ============================================================

CREATE TABLE IF NOT EXISTS user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,

  -- API call quotas
  perplexity_calls_remaining INTEGER DEFAULT 100,
  lovable_calls_remaining INTEGER DEFAULT 50,
  elevenlabs_calls_remaining INTEGER DEFAULT 20,
  evolution_cycles_remaining INTEGER DEFAULT 50,

  -- Cost tracking
  cost_remaining_usd NUMERIC(10,4) DEFAULT 5.0,

  -- Reset tracking
  reset_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON user_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quotas_reset_at ON user_quotas(reset_at);

-- Enable RLS
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own quota" ON user_quotas;
CREATE POLICY "Users can view own quota" ON user_quotas
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to quotas" ON user_quotas;
CREATE POLICY "Service role full access to quotas" ON user_quotas
  FOR ALL USING (true);

-- Function to decrement user quota
CREATE OR REPLACE FUNCTION decrement_user_quota(
  p_user_id UUID,
  p_perplexity INTEGER DEFAULT 0,
  p_lovable INTEGER DEFAULT 0,
  p_elevenlabs INTEGER DEFAULT 0,
  p_cost NUMERIC DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_quotas
  SET
    perplexity_calls_remaining = GREATEST(0, perplexity_calls_remaining - p_perplexity),
    lovable_calls_remaining = GREATEST(0, lovable_calls_remaining - p_lovable),
    elevenlabs_calls_remaining = GREATEST(0, elevenlabs_calls_remaining - p_elevenlabs),
    cost_remaining_usd = GREATEST(0, cost_remaining_usd - p_cost),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- ============================================================
-- SECTION 3: Evolution Jobs Table (Background Scheduling)
-- ============================================================

CREATE TABLE IF NOT EXISTS evolution_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),

  -- Job parameters (stored as JSONB)
  params JSONB NOT NULL DEFAULT '{}',

  -- Execution tracking
  scheduled_for TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Results
  result JSONB,
  error_message TEXT,

  -- Retry tracking
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Ownership
  tenant_id UUID,
  user_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for job processing
CREATE INDEX IF NOT EXISTS idx_evolution_jobs_status ON evolution_jobs(status);
CREATE INDEX IF NOT EXISTS idx_evolution_jobs_scheduled ON evolution_jobs(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_evolution_jobs_tenant ON evolution_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evolution_jobs_user ON evolution_jobs(user_id);

-- Enable RLS
ALTER TABLE evolution_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to jobs" ON evolution_jobs;
CREATE POLICY "Service role full access to jobs" ON evolution_jobs
  FOR ALL USING (true);

-- ============================================================
-- SECTION 4: Agent Billing Events Table
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Attribution
  tenant_id UUID,
  user_id UUID,

  -- Cost tracking
  cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
  breakdown JSONB DEFAULT '{}',

  -- Event metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for billing queries
CREATE INDEX IF NOT EXISTS idx_billing_tenant ON agent_billing_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_user ON agent_billing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_created ON agent_billing_events(created_at);

-- Enable RLS
ALTER TABLE agent_billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own billing" ON agent_billing_events;
CREATE POLICY "Users can view own billing" ON agent_billing_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to billing" ON agent_billing_events;
CREATE POLICY "Service role full access to billing" ON agent_billing_events
  FOR ALL USING (true);

-- ============================================================
-- SECTION 5: Billing Summary View
-- ============================================================

CREATE OR REPLACE VIEW billing_summary AS
SELECT
  user_id,
  tenant_id,
  DATE_TRUNC('day', created_at) as billing_date,
  SUM(cost_usd) as total_cost,
  COUNT(*) as event_count,
  SUM((breakdown->>'perplexity'->>'calls')::integer) as perplexity_calls,
  SUM((breakdown->>'lovable'->>'calls')::integer) as lovable_calls,
  SUM((breakdown->>'elevenlabs'->>'calls')::integer) as elevenlabs_calls
FROM agent_billing_events
GROUP BY user_id, tenant_id, DATE_TRUNC('day', created_at);

-- ============================================================
-- SECTION 6: Auto-reset quotas trigger
-- ============================================================

CREATE OR REPLACE FUNCTION reset_expired_quotas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_quotas
  SET
    perplexity_calls_remaining = 100,
    lovable_calls_remaining = 50,
    elevenlabs_calls_remaining = 20,
    evolution_cycles_remaining = 50,
    cost_remaining_usd = 5.0,
    reset_at = NOW() + INTERVAL '24 hours',
    updated_at = NOW()
  WHERE reset_at < NOW();
END;
$$;

-- ============================================================
-- SECTION 7: Background job processor function
-- ============================================================

CREATE OR REPLACE FUNCTION claim_next_evolution_job()
RETURNS TABLE(job_id UUID, job_params JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claimed_job evolution_jobs%ROWTYPE;
BEGIN
  -- Claim the next pending job atomically
  UPDATE evolution_jobs
  SET
    status = 'running',
    started_at = NOW(),
    updated_at = NOW()
  WHERE id = (
    SELECT id FROM evolution_jobs
    WHERE status = 'pending'
      AND scheduled_for <= NOW()
      AND retry_count < max_retries
    ORDER BY scheduled_for ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING * INTO claimed_job;

  IF claimed_job.id IS NOT NULL THEN
    RETURN QUERY SELECT claimed_job.id, claimed_job.params;
  END IF;
END;
$$;

-- Function to mark job as completed
CREATE OR REPLACE FUNCTION complete_evolution_job(
  p_job_id UUID,
  p_result JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE evolution_jobs
  SET
    status = 'completed',
    completed_at = NOW(),
    result = p_result,
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$;

-- Function to mark job as failed
CREATE OR REPLACE FUNCTION fail_evolution_job(
  p_job_id UUID,
  p_error TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE evolution_jobs
  SET
    status = CASE
      WHEN retry_count + 1 >= max_retries THEN 'failed'
      ELSE 'pending'
    END,
    retry_count = retry_count + 1,
    error_message = p_error,
    scheduled_for = CASE
      WHEN retry_count + 1 < max_retries THEN NOW() + (INTERVAL '1 minute' * POWER(2, retry_count))
      ELSE scheduled_for
    END,
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$;

-- ============================================================
-- SECTION 8: Tribe statistics view
-- ============================================================

CREATE OR REPLACE VIEW tribe_evolution_stats AS
SELECT
  tribe,
  COUNT(*) as agent_count,
  AVG(success_rate) as avg_success_rate,
  AVG(learning_velocity) as avg_learning_velocity,
  AVG(atlas_identity_score) as avg_identity_score,
  SUM(total_tasks_completed) as total_tasks,
  COUNT(*) FILTER (WHERE voice_id IS NOT NULL) as voice_enabled_agents
FROM sonic_agents
GROUP BY tribe
ORDER BY avg_success_rate DESC;

-- ============================================================
-- SECTION 9: Sector performance view
-- ============================================================

CREATE OR REPLACE VIEW sector_evolution_stats AS
SELECT
  sector,
  COUNT(*) as agent_count,
  AVG(success_rate) as avg_success_rate,
  AVG(learning_velocity) as avg_learning_velocity,
  AVG(atlas_identity_score) as avg_identity_score,
  SUM(total_tasks_completed) as total_tasks
FROM sonic_agents
GROUP BY sector
ORDER BY avg_success_rate DESC;

-- ============================================================
-- DONE
-- ============================================================

COMMENT ON TABLE user_quotas IS 'Per-user API quotas for rate limiting and cost control';
COMMENT ON TABLE evolution_jobs IS 'Background job queue for scheduled evolution cycles';
COMMENT ON TABLE agent_billing_events IS 'Billing events for API usage tracking';
COMMENT ON COLUMN sonic_agents.voice_id IS 'ElevenLabs voice ID for voice synthesis';
COMMENT ON COLUMN sonic_agents.atlas_identity_score IS 'Self-identity evolution score (0-1)';
