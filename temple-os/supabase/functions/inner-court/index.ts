/**
 * Temple OS - Inner Court Service
 * Task planning, context building, priestly orchestration
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseClient } from '../_shared/db.ts';
import { callLLM, generateEmbedding } from '../_shared/llm.ts';
import { ServiceLogger } from '../_shared/logger.ts';

const PLANNING_PROMPT = `You are the Inner Court task planner for Temple OS.

Your role is to break down complex requests into subtasks and assign them to specialized Priests.

Available Priests:
- life: Personal goals, tasks, routines, and life planning
- learning: Educational content, explanations, and study plans
- creator: Content creation and storytelling
- career: Career development, CV, and professional positioning
- strategy: Strategic planning, OKRs, and business narratives
- finance: Financial analysis and planning
- ops: Process optimization and operational excellence
- tech: Technical architecture and technology decisions
- people: Organizational structure and people management
- research: External intelligence and research

Given the user's request, create a task plan with subtasks.

Respond with JSON:
{
  "high_level_goal": "summary of what we're trying to accomplish",
  "subtasks": [
    {
      "description": "what this subtask needs to do",
      "assigned_priest": "priest_id",
      "inputs": {"key": "value pairs needed"}
    }
  ],
  "required_capabilities": ["list", "of", "capabilities"],
  "estimated_complexity": "low | medium | high",
  "needs_alignment_review": true/false,
  "reasoning": "why you structured it this way"
}`;

serve(async (req) => {
  const startTime = Date.now();

  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const supabase = createSupabaseClient(req);
    const body = await req.json();
    const classifiedRequest = body.classified_request;

    const logger = new ServiceLogger(
      supabase,
      classifiedRequest.request_id,
      classifiedRequest.user_identity.user_id,
      classifiedRequest.user_identity.org_id,
      'inner-court'
    );

    await logger.info('Inner Court processing request', {
      domain: classifiedRequest.domain,
      intent: classifiedRequest.intent,
    });

    // Step 1: Build context bundle
    await logger.info('Building context bundle');
    const contextBundle = await buildContextBundle(supabase, classifiedRequest, logger);

    // Step 2: Create task plan
    await logger.info('Creating task plan');
    const taskPlan = await createTaskPlan(supabase, classifiedRequest, contextBundle, logger);

    // Step 3: Orchestrate priestly services
    await logger.info('Orchestrating priests', {
      priests: taskPlan.target_priests,
      subtask_count: taskPlan.subtasks.length,
    });

    const priestOutputs: Record<string, any> = {};

    for (const subtask of taskPlan.subtasks) {
      await logger.info(`Calling ${subtask.assigned_priest} priest`, {
        subtask_id: subtask.subtask_id,
      });

      try {
        // Update subtask status
        await supabase
          .from('subtasks')
          .update({ status: 'in_progress' })
          .eq('subtask_id', subtask.subtask_id);

        // Call the priest service
        const priestResult = await callPriest(
          subtask.assigned_priest,
          subtask,
          contextBundle,
          logger
        );

        // Update subtask with outputs
        await supabase
          .from('subtasks')
          .update({
            status: 'completed',
            outputs: priestResult.outputs,
          })
          .eq('subtask_id', subtask.subtask_id);

        priestOutputs[subtask.assigned_priest] = priestResult.outputs;
      } catch (error) {
        await logger.error(`Priest ${subtask.assigned_priest} failed`, {
          subtask_id: subtask.subtask_id,
          error: error.message,
        });

        await supabase
          .from('subtasks')
          .update({
            status: 'failed',
            error: error.message,
          })
          .eq('subtask_id', subtask.subtask_id);
      }
    }

    const processingTime = Date.now() - startTime;
    await logger.metric('inner_court_processing_time', processingTime);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          task_plan: taskPlan,
          context_bundle: contextBundle,
          priest_outputs: priestOutputs,
          ready_for_sanctuary: true,
        },
        metadata: {
          service: 'inner-court',
          request_id: classifiedRequest.request_id,
          processing_time_ms: processingTime,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Inner Court error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INNER_COURT_ERROR',
          message: error.message,
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function buildContextBundle(
  supabase: any,
  classifiedRequest: any,
  logger: ServiceLogger
): Promise<any> {
  const userId = classifiedRequest.user_identity.user_id;
  const orgId = classifiedRequest.user_identity.org_id;
  const teamId = classifiedRequest.user_identity.active_team_id;

  // Get user profile and preferences
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Get user goals
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(10);

  // Get team contexts if applicable
  const teamContexts: any[] = [];
  if (teamId) {
    const { data: team } = await supabase
      .from('teams')
      .select('*, team_memberships(*)')
      .eq('team_id', teamId)
      .single();

    if (team) {
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('team_id', teamId)
        .eq('status', 'active');

      teamContexts.push({
        team_id: team.team_id,
        name: team.name,
        members: team.team_memberships,
        projects: projects || [],
      });
    }
  }

  // Get org context if applicable
  let orgContext = null;
  if (orgId) {
    const { data: org } = await supabase
      .from('orgs')
      .select('*')
      .eq('org_id', orgId)
      .single();

    orgContext = org;
  }

  // Get relevant memories using embeddings
  const embedding = await generateEmbedding(classifiedRequest.normalized_text);

  const { data: memories } = await supabase.rpc('match_memory_items', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: 10,
    filter_user_id: userId,
  }).catch(() => ({ data: [] })); // Fallback if function doesn't exist

  // Get applicable policies
  const { data: policies } = await supabase
    .from('policies')
    .select('policy_id')
    .or(`org_id.eq.${orgId},org_id.is.null`)
    .eq('active', true);

  return {
    request_id: classifiedRequest.request_id,
    user_context: {
      user_id: userId,
      mode: classifiedRequest.user_identity.mode,
      roles: classifiedRequest.user_identity.roles,
      preferences: userProfile?.preferences || {},
    },
    personal_context: {
      goals: goals || [],
      profile: userProfile,
    },
    team_contexts: teamContexts,
    org_context: orgContext,
    domain_knowledge: [], // Would be populated from knowledge_snippets
    short_term_memory: memories?.slice(0, 5) || [],
    long_term_memory_refs: memories?.slice(5).map((m: any) => m.memory_id) || [],
    policies_applicable: policies?.map((p: any) => p.policy_id) || [],
  };
}

async function createTaskPlan(
  supabase: any,
  classifiedRequest: any,
  contextBundle: any,
  logger: ServiceLogger
): Promise<any> {
  // Build context summary for planner
  const contextSummary = `
User Mode: ${classifiedRequest.user_identity.mode}
Domain: ${classifiedRequest.domain}
Intent: ${classifiedRequest.intent}
Active Goals: ${contextBundle.personal_context.goals.length}
Team Context: ${contextBundle.team_contexts.length > 0 ? 'Yes' : 'No'}
Org Context: ${contextBundle.org_context ? 'Yes' : 'No'}
`;

  const planningResult = await callLLM({
    model: 'gpt-4-turbo-preview',
    system_prompt: PLANNING_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Context:\n${contextSummary}\n\nUser Request:\n"${classifiedRequest.normalized_text}"\n\nCreate a task plan.`,
      },
    ],
    temperature: 0.5,
    max_tokens: 1500,
  });

  const plan = JSON.parse(planningResult.parsed_content as string);

  // Create plan record
  const plan_id = crypto.randomUUID();
  await supabase.from('task_plans').insert({
    plan_id,
    request_id: classifiedRequest.request_id,
    user_id: classifiedRequest.user_identity.user_id,
    org_id: classifiedRequest.user_identity.org_id,
    high_level_goal: plan.high_level_goal,
    required_capabilities: plan.required_capabilities,
    target_priests: plan.subtasks.map((s: any) => s.assigned_priest),
    estimated_complexity: plan.estimated_complexity,
    needs_alignment_review: plan.needs_alignment_review,
  });

  // Create subtask records
  const subtasks = [];
  for (const subtask of plan.subtasks) {
    const subtask_id = crypto.randomUUID();
    await supabase.from('subtasks').insert({
      subtask_id,
      plan_id,
      description: subtask.description,
      assigned_priest: subtask.assigned_priest,
      inputs: subtask.inputs,
      status: 'pending',
    });

    subtasks.push({
      subtask_id,
      description: subtask.description,
      assigned_priest: subtask.assigned_priest,
      inputs: subtask.inputs,
      status: 'pending',
      outputs: null,
    });
  }

  return {
    plan_id,
    request_id: classifiedRequest.request_id,
    high_level_goal: plan.high_level_goal,
    subtasks,
    required_capabilities: plan.required_capabilities,
    target_priests: plan.subtasks.map((s: any) => s.assigned_priest),
    estimated_complexity: plan.estimated_complexity,
    needs_alignment_review: plan.needs_alignment_review,
  };
}

async function callPriest(
  priestId: string,
  subtask: any,
  contextBundle: any,
  logger: ServiceLogger
): Promise<any> {
  // In production, this would call the actual priest Edge Function
  // For now, we'll make a direct HTTP call
  const supabaseUrl = Deno.env.get('SUPABASE_URL');

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/priests/${priestId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      },
      body: JSON.stringify({
        subtask,
        context: contextBundle,
      }),
    });

    if (!response.ok) {
      throw new Error(`Priest ${priestId} returned ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    await logger.warn(`Failed to call priest ${priestId}, using fallback`, {
      error: error.message,
    });

    // Fallback: simple processing
    return {
      outputs: {
        status: 'completed_with_fallback',
        result: `Priest ${priestId} processed: ${subtask.description}`,
      },
    };
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
