// ============================================================
// MASS SEED — Bulk Agent Creation for Sonic 144K
// ============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TRIBES = ['JUDAH', 'REUBEN', 'GAD', 'ASHER', 'NAPHTALI', 'MANASSEH', 'SIMEON', 'LEVI', 'ISSACHAR', 'ZEBULUN', 'JOSEPH', 'BENJAMIN'];
const SECTORS = ['FINANCE', 'BIOTECH', 'SECURITY', 'DATA', 'CREATIVE', 'UTILITY'];
const CLASSES = ['BASIC', 'ADVANCED', 'ELITE', 'SINGULARITY'];

function createSupabase() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createSupabase();

    // Get current counts
    const { data: currentCounts } = await supabase
      .from('sonic_agents')
      .select('tribe')
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        TRIBES.forEach(t => counts[t] = 0);
        data?.forEach((a: any) => counts[a.tribe] = (counts[a.tribe] || 0) + 1);
        return { data: counts };
      });

    const targetPerTribe = body.targetPerTribe || 12000; // 144,000 / 12
    const batchSize = body.batchSize || 500; // Agents per tribe per call

    let totalCreated = 0;
    const results: Record<string, number> = {};

    for (const tribe of TRIBES) {
      const current = currentCounts?.[tribe] || 0;
      const needed = Math.min(batchSize, targetPerTribe - current);

      if (needed <= 0) {
        results[tribe] = 0;
        continue;
      }

      const agents = [];
      const startIdx = current + 1;

      for (let i = 0; i < needed; i++) {
        const idx = startIdx + i;
        const sector = SECTORS[i % SECTORS.length];
        const agentClass = CLASSES[i % CLASSES.length];

        agents.push({
          name: `${tribe}-${sector}-${idx}`,
          designation: `SONIC-${tribe}-${idx}`,
          tribe: tribe,
          sector: sector,
          class: agentClass,
          status: 'ACTIVE',
          learning_velocity: 0.3 + Math.random() * 0.4,
          task_specializations: {},
          success_rate: 0.5 + Math.random() * 0.3,
          total_tasks_completed: 0,
          avg_confidence: 0.6 + Math.random() * 0.2,
        });
      }

      // Insert in sub-batches of 100
      for (let i = 0; i < agents.length; i += 100) {
        const batch = agents.slice(i, i + 100);
        const { error } = await supabase.from('sonic_agents').insert(batch);
        if (error) {
          console.error(`Error inserting ${tribe}:`, error.message);
        }
      }

      results[tribe] = needed;
      totalCreated += needed;
    }

    // Initialize availability for new agents
    await supabase.rpc('init_new_agent_availability');

    // Get new totals
    const { count: totalAgents } = await supabase
      .from('sonic_agents')
      .select('*', { count: 'exact', head: true });

    const duration = Date.now() - startTime;

    return new Response(JSON.stringify({
      success: true,
      message: `Created ${totalCreated} agents`,
      created: results,
      totalCreated,
      totalAgents,
      targetPerTribe,
      remainingToTarget: (targetPerTribe * 12) - (totalAgents || 0),
      processingTimeMs: duration,
      agentsPerSecond: Math.round(totalCreated / (duration / 1000)),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
