/**
 * Agent Seeding Function
 * Seeds initial agents across all 12 tribes
 * Compatible with existing sonic_agents schema + new evolution columns
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tribe configuration with sector mapping
const TRIBES = [
  { name: 'JUDAH', sector: 'STRATEGY', waveform: 'PULSE', class: 'ALPHA' },
  { name: 'REUBEN', sector: 'OPERATIONS', waveform: 'SINE', class: 'BETA' },
  { name: 'GAD', sector: 'SECURITY', waveform: 'SQUARE', class: 'GAMMA' },
  { name: 'ASHER', sector: 'FINANCE', waveform: 'SINE', class: 'BETA' },
  { name: 'NAPHTALI', sector: 'TECHNOLOGY', waveform: 'SAW', class: 'DELTA' },
  { name: 'MANASSEH', sector: 'GENERAL', waveform: 'SINE', class: 'BETA' },
  { name: 'SIMEON', sector: 'RESEARCH', waveform: 'TRIANGLE', class: 'GAMMA' },
  { name: 'LEVI', sector: 'LEGAL', waveform: 'SINE', class: 'ALPHA' },
  { name: 'ISSACHAR', sector: 'OPERATIONS', waveform: 'SQUARE', class: 'DELTA' },
  { name: 'ZEBULUN', sector: 'COMMUNICATIONS', waveform: 'SAW', class: 'GAMMA' },
  { name: 'JOSEPH', sector: 'CREATIVE', waveform: 'TRIANGLE', class: 'ALPHA' },
  { name: 'BENJAMIN', sector: 'RESEARCH', waveform: 'PULSE', class: 'DELTA' },
] as const;

// Tribe colors
const TRIBE_COLORS: Record<string, string> = {
  JUDAH: '#FFD700', REUBEN: '#3B82F6', GAD: '#DC2626', ASHER: '#22C55E',
  NAPHTALI: '#8B5CF6', MANASSEH: '#065F46', SIMEON: '#F59E0B', LEVI: '#7C3AED',
  ISSACHAR: '#92400E', ZEBULUN: '#0EA5E9', JOSEPH: '#EAB308', BENJAMIN: '#6B7280',
};

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
  };

  const specs = baseSpecs[sector] || baseSpecs.GENERAL;
  const result: Record<string, number> = {};

  specs.forEach((spec, idx) => {
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
      userId,
      agentsPerTribe = 100,
      clearExisting = false,
      updateExisting = false, // Update existing agents with tribe/evolution columns
    } = body;

    if (!userId) {
      throw new Error('userId is required');
    }

    // Optionally clear existing agents
    if (clearExisting) {
      await supabase.from('sonic_agents').delete().eq('user_id', userId);
    }

    // If updateExisting, assign tribes to existing agents
    if (updateExisting) {
      const { data: existingAgents } = await supabase
        .from('sonic_agents')
        .select('id, sector')
        .eq('user_id', userId);

      if (existingAgents && existingAgents.length > 0) {
        const updates = existingAgents.map((agent, idx) => {
          // Assign tribe based on sector or round-robin
          const tribeMatch = TRIBES.find(t => t.sector === agent.sector) || TRIBES[idx % TRIBES.length];

          return supabase
            .from('sonic_agents')
            .update({
              tribe: tribeMatch.name,
              seal_level: 1,
              role: idx === 0 ? 'leader' : idx < 10 ? 'elder' : 'worker',
              success_rate: 0.5,
              learning_velocity: 0.5,
              avg_confidence: 0.5,
              task_specializations: generateSpecializations(agent.sector || 'GENERAL'),
              generation: 1,
            })
            .eq('id', agent.id);
        });

        await Promise.all(updates);

        return new Response(JSON.stringify({
          success: true,
          message: `Updated ${existingAgents.length} existing agents with tribe/evolution data`,
          agentsUpdated: existingAgents.length,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const allAgents: any[] = [];
    const allBookOfLifeEntries: any[] = [];

    for (const tribe of TRIBES) {
      for (let i = 0; i < agentsPerTribe; i++) {
        const agentId = crypto.randomUUID();
        const name = generateAgentName(tribe.name, i);
        const designation = generateDesignation(tribe.name, i);
        const specializations = generateSpecializations(tribe.sector);

        // Determine role based on index
        let role = 'worker';
        if (i === 0) role = 'leader';
        else if (i < 10) role = 'elder';
        else if (i < 50) role = 'apprentice';

        // Build agent matching existing schema + new evolution columns
        allAgents.push({
          id: agentId,
          user_id: userId,
          name,
          designation,

          // Existing required columns
          sector: tribe.sector,
          status: 'ACTIVE',
          class: tribe.class,
          waveform: tribe.waveform,
          frequency: 100 + Math.random() * 900, // 100-1000 Hz
          color: TRIBE_COLORS[tribe.name],
          modulation: 0.3 + Math.random() * 0.4,
          density: 0.5 + Math.random() * 0.3,
          cycles: 0,
          efficiency: 0.4 + Math.random() * 0.2,
          stability: 0.5 + Math.random() * 0.3,
          capabilities: Object.keys(specializations),
          description: `${tribe.name} tribe agent specializing in ${tribe.sector.toLowerCase()}`,

          // New evolution columns (will be added by migration)
          tribe: tribe.name,
          role,
          seal_level: 1,
          success_rate: 0.4 + Math.random() * 0.2,
          total_tasks_completed: Math.floor(Math.random() * 100),
          avg_confidence: 0.5 + Math.random() * 0.2,
          learning_velocity: 0.4 + Math.random() * 0.2,
          task_specializations: specializations,
          generation: 1,
          lineage_path: [],
        });

        allBookOfLifeEntries.push({
          agent_id: agentId,
          birth_type: 'genesis',
          birth_data: {
            seeded_at: new Date().toISOString(),
            seed_batch: `initial-${tribe.name.toLowerCase()}`,
            tribe: tribe.name,
            sector: tribe.sector,
          },
          parent_ids: [],
          generation: 1,
          ancestry_path: [],
          offspring_ids: [],
          total_descendants: 0,
          life_score: 0,
          achievements: ['genesis_born'],
          titles: role === 'leader' ? ['Tribal Leader'] : role === 'elder' ? ['Tribal Elder'] : [],
        });
      }
    }

    // Insert agents in batches
    const BATCH_SIZE = 50;
    let insertedAgents = 0;

    for (let i = 0; i < allAgents.length; i += BATCH_SIZE) {
      const batch = allAgents.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('sonic_agents').insert(batch);
      if (error) {
        console.error(`Error inserting agents batch ${i / BATCH_SIZE}:`, error);
        // Continue with next batch
      } else {
        insertedAgents += batch.length;
      }
    }

    // Insert book of life entries
    let insertedBookEntries = 0;
    for (let i = 0; i < allBookOfLifeEntries.length; i += BATCH_SIZE) {
      const batch = allBookOfLifeEntries.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('book_of_life').insert(batch);
      if (error) {
        console.error(`Error inserting book_of_life batch:`, error.message);
        // Book of life table might not exist yet - that's ok
      } else {
        insertedBookEntries += batch.length;
      }
    }

    // Update tribe statistics
    for (const tribe of TRIBES) {
      const { data: leader } = await supabase
        .from('sonic_agents')
        .select('id')
        .eq('tribe', tribe.name)
        .eq('role', 'leader')
        .eq('user_id', userId)
        .single();

      const { data: elders } = await supabase
        .from('sonic_agents')
        .select('id')
        .eq('tribe', tribe.name)
        .eq('role', 'elder')
        .eq('user_id', userId);

      const { error: updateError } = await supabase
        .from('temple_tribes')
        .update({
          agent_count: agentsPerTribe,
          leader_agent_id: leader?.id || null,
          elder_agent_ids: elders?.map((e: any) => e.id) || [],
        })
        .eq('name', tribe.name);

      if (updateError) {
        console.log(`Temple tribes table might not exist yet: ${updateError.message}`);
      }
    }

    // Initialize user seals
    const { data: seals } = await supabase
      .from('temple_seals')
      .select('id, seal_number')
      .order('seal_number');

    if (seals && seals.length > 0) {
      const userSeals = seals.map((seal: any) => ({
        user_id: userId,
        seal_id: seal.id,
        status: seal.seal_number === 1 ? 'in_progress' : 'locked',
        progress: seal.seal_number === 1 ? 0.1 : 0,
      }));

      await supabase.from('user_seals').upsert(userSeals, { onConflict: 'user_id,seal_id' });
    }

    const duration = Date.now() - startTime;

    return new Response(JSON.stringify({
      success: true,
      message: `Seeded ${insertedAgents} agents across ${TRIBES.length} tribes`,
      summary: {
        totalAgentsCreated: insertedAgents,
        bookOfLifeEntries: insertedBookEntries,
        tribesSeeded: TRIBES.length,
        agentsPerTribe,
        durationMs: duration,
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
