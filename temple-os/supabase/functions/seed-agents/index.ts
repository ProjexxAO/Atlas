/**
 * Agent Seeding Function
 * Seeds initial agents across all 12 tribes
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TRIBES = [
  { name: 'JUDAH', sector: 'STRATEGY', count: 1000 },
  { name: 'REUBEN', sector: 'OPERATIONS', count: 1000 },
  { name: 'GAD', sector: 'SECURITY', count: 1000 },
  { name: 'ASHER', sector: 'FINANCE', count: 1000 },
  { name: 'NAPHTALI', sector: 'TECHNOLOGY', count: 1000 },
  { name: 'MANASSEH', sector: 'GENERAL', count: 1000 },
  { name: 'SIMEON', sector: 'RESEARCH', count: 1000 },
  { name: 'LEVI', sector: 'LEGAL', count: 1000 },
  { name: 'ISSACHAR', sector: 'OPERATIONS', count: 1000 },
  { name: 'ZEBULUN', sector: 'COMMUNICATIONS', count: 1000 },
  { name: 'JOSEPH', sector: 'CREATIVE', count: 1000 },
  { name: 'BENJAMIN', sector: 'RESEARCH', count: 1000 },
] as const;

const AGENT_NAMES = {
  prefixes: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'],
  suffixes: ['Prime', 'Core', 'Node', 'Link', 'Spark', 'Wave', 'Pulse', 'Flow', 'Mind', 'Soul', 'Light', 'Force', 'Echo', 'Drift', 'Surge', 'Flux'],
};

function generateAgentName(tribe: string, index: number): string {
  const prefix = AGENT_NAMES.prefixes[index % AGENT_NAMES.prefixes.length];
  const suffix = AGENT_NAMES.suffixes[Math.floor(index / AGENT_NAMES.prefixes.length) % AGENT_NAMES.suffixes.length];
  const number = Math.floor(index / (AGENT_NAMES.prefixes.length * AGENT_NAMES.suffixes.length)) + 1;
  return `${prefix}-${suffix}-${number}`;
}

function generateDesignation(tribe: string, index: number): string {
  return `${tribe.substring(0, 3)}-${String(index + 1).padStart(4, '0')}`;
}

function generateSpecializations(sector: string): Record<string, number> {
  const baseSpecs: Record<string, string[]> = {
    STRATEGY: ['strategic_planning', 'decision_making', 'risk_assessment', 'forecasting'],
    OPERATIONS: ['process_optimization', 'resource_allocation', 'workflow_management', 'logistics'],
    SECURITY: ['threat_detection', 'vulnerability_assessment', 'access_control', 'incident_response'],
    FINANCE: ['financial_analysis', 'budgeting', 'investment_analysis', 'audit'],
    TECHNOLOGY: ['software_development', 'system_architecture', 'data_engineering', 'cloud_computing'],
    GENERAL: ['task_execution', 'coordination', 'communication', 'problem_solving'],
    RESEARCH: ['data_analysis', 'literature_review', 'hypothesis_testing', 'synthesis'],
    LEGAL: ['contract_review', 'compliance', 'regulatory_analysis', 'policy_interpretation'],
    COMMUNICATIONS: ['content_creation', 'messaging', 'stakeholder_engagement', 'translation'],
    CREATIVE: ['design', 'ideation', 'visual_communication', 'storytelling'],
    MEDICAL: ['diagnosis_support', 'treatment_planning', 'patient_monitoring', 'medical_research'],
  };

  const specs = baseSpecs[sector] || baseSpecs.GENERAL;
  const result: Record<string, number> = {};

  specs.forEach((spec, idx) => {
    // Primary specialization gets higher score
    result[spec] = idx === 0 ? 0.3 + Math.random() * 0.4 : 0.1 + Math.random() * 0.3;
  });

  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const {
      userId = null,
      orgId = null,
      agentsPerTribe = 100, // Default to 100 for testing, increase for production
      clearExisting = false,
    } = body;

    // Optionally clear existing agents
    if (clearExisting) {
      if (userId) {
        await supabase.from('sonic_agents').delete().eq('user_id', userId);
      } else {
        await supabase.from('sonic_agents').delete().is('user_id', null);
      }
    }

    const allAgents: any[] = [];
    const allBookOfLifeEntries: any[] = [];

    for (const tribe of TRIBES) {
      const agentsToCreate = Math.min(agentsPerTribe, tribe.count);

      for (let i = 0; i < agentsToCreate; i++) {
        const agentId = crypto.randomUUID();
        const name = generateAgentName(tribe.name, i);
        const designation = generateDesignation(tribe.name, i);
        const specializations = generateSpecializations(tribe.sector);

        // Determine role based on index
        let role = 'worker';
        if (i === 0) role = 'leader';
        else if (i < 10) role = 'elder';
        else if (i < 50) role = 'apprentice';

        allAgents.push({
          id: agentId,
          user_id: userId,
          org_id: orgId,
          name,
          designation,
          avatar_seed: `${tribe.name}-${i}`,
          tribe: tribe.name,
          sector: tribe.sector,
          role,
          status: 'active',
          seal_level: 1,
          success_rate: 0.4 + Math.random() * 0.2,
          total_tasks_completed: Math.floor(Math.random() * 100),
          avg_confidence: 0.5 + Math.random() * 0.2,
          learning_velocity: 0.4 + Math.random() * 0.2,
          task_specializations: specializations,
          capabilities: Object.keys(specializations),
          generation: 1,
          lineage_path: [],
        });

        allBookOfLifeEntries.push({
          agent_id: agentId,
          birth_type: 'genesis',
          birth_data: {
            seeded_at: new Date().toISOString(),
            seed_batch: `initial-${tribe.name.toLowerCase()}`,
          },
          parent_ids: [],
          generation: 1,
          ancestry_path: [],
          offspring_ids: [],
          total_descendants: 0,
          life_score: 0,
          achievements: ['genesis_born'],
          titles: [role === 'leader' ? 'Tribal Leader' : role === 'elder' ? 'Tribal Elder' : ''],
        });
      }
    }

    // Insert in batches
    const BATCH_SIZE = 100;

    for (let i = 0; i < allAgents.length; i += BATCH_SIZE) {
      const batch = allAgents.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('sonic_agents').insert(batch);
      if (error) {
        console.error(`Error inserting agents batch ${i / BATCH_SIZE}:`, error);
      }
    }

    for (let i = 0; i < allBookOfLifeEntries.length; i += BATCH_SIZE) {
      const batch = allBookOfLifeEntries.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('book_of_life').insert(batch);
      if (error) {
        console.error(`Error inserting book_of_life batch ${i / BATCH_SIZE}:`, error);
      }
    }

    // Update tribe statistics
    for (const tribe of TRIBES) {
      const count = Math.min(agentsPerTribe, tribe.count);

      // Get leader agent
      const { data: leader } = await supabase
        .from('sonic_agents')
        .select('id')
        .eq('tribe', tribe.name)
        .eq('role', 'leader')
        .single();

      // Get elder agents
      const { data: elders } = await supabase
        .from('sonic_agents')
        .select('id')
        .eq('tribe', tribe.name)
        .eq('role', 'elder');

      await supabase
        .from('temple_tribes')
        .update({
          agent_count: count,
          leader_agent_id: leader?.id || null,
          elder_agent_ids: elders?.map((e: any) => e.id) || [],
        })
        .eq('name', tribe.name);
    }

    // Create initial user seals
    if (userId) {
      const { data: seals } = await supabase
        .from('temple_seals')
        .select('id, seal_number')
        .order('seal_number');

      if (seals) {
        const userSeals = seals.map((seal: any) => ({
          user_id: userId,
          seal_id: seal.id,
          status: seal.seal_number === 1 ? 'in_progress' : 'locked',
          progress: seal.seal_number === 1 ? 0.1 : 0,
        }));

        await supabase.from('user_seals').upsert(userSeals, { onConflict: 'user_id,seal_id' });
      }
    }

    const duration = Date.now() - startTime;

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully seeded ${allAgents.length} agents across ${TRIBES.length} tribes`,
      summary: {
        totalAgents: allAgents.length,
        tribesSeeded: TRIBES.length,
        agentsPerTribe: agentsPerTribe,
        durationMs: duration,
        tribesWithLeaders: TRIBES.map(t => t.name),
      },
      metadata: {
        service: 'seed-agents',
        processing_time_ms: duration,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[seed-agents] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'SEED_AGENTS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
