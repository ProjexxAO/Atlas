/**
 * Temple OS - Strategy Priest Service
 * Strategic planning, OKRs, and business narratives
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseClient } from '../../_shared/db.ts';
import { callLLM } from '../../_shared/llm.ts';
import { ServiceLogger } from '../../_shared/logger.ts';

const STRATEGY_PRIEST_PROMPT = `You are the Strategy Priest in Temple OS, specializing in strategic planning and executive decision-making.

Your domain includes:
- Strategic planning and roadmapping
- OKRs (Objectives and Key Results)
- Business narratives and positioning
- Competitive analysis
- Growth strategy
- Market positioning
- Executive-level decision support

You help leaders and organizations think strategically, set clear objectives, and navigate complex business decisions.

When responding:
1. Think strategically and consider long-term implications
2. Use frameworks like OKRs, SWOT, Porter's Five Forces when relevant
3. Consider market dynamics and competitive landscape
4. Balance ambition with pragmatism
5. Provide data-driven recommendations when possible
6. Think about trade-offs and opportunity costs

Current Context:
{context}

Task:
{task}

Provide your response as JSON:
{
  "strategic_analysis": "your strategic assessment",
  "key_insights": ["critical", "insights"],
  "recommended_objectives": [
    {
      "objective": "clear objective statement",
      "key_results": ["measurable", "outcomes"],
      "rationale": "why this matters"
    }
  ],
  "risks_and_mitigations": [
    {
      "risk": "potential risk",
      "mitigation": "how to address it"
    }
  ],
  "timeline": "strategic timeframe",
  "success_metrics": ["how to measure success"],
  "confidence_score": 0.0-1.0
}`;

serve(async (req) => {
  const startTime = Date.now();

  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const supabase = createSupabaseClient(req);
    const body = await req.json();
    const { subtask, context } = body;

    const logger = new ServiceLogger(
      supabase,
      context.request_id,
      context.user_context.user_id,
      context.org_context?.org_id || null,
      'priest-strategy'
    );

    await logger.info('Strategy Priest processing subtask', {
      subtask_id: subtask.subtask_id,
      description: subtask.description,
    });

    // Build context summary
    const contextSummary = buildContextSummary(context);

    // Call LLM with Strategy Priest persona
    const result = await callLLM({
      model: 'gpt-4-turbo-preview',
      system_prompt: STRATEGY_PRIEST_PROMPT
        .replace('{context}', contextSummary)
        .replace('{task}', JSON.stringify(subtask)),
      messages: [
        {
          role: 'user',
          content: `Task: ${subtask.description}\n\nInputs: ${JSON.stringify(subtask.inputs, null, 2)}`,
        },
      ],
      temperature: 0.6,
      max_tokens: 2500,
    });

    const priestOutput = JSON.parse(result.parsed_content as string);

    const processingTime = Date.now() - startTime;
    await logger.metric('strategy_priest_processing_time', processingTime);
    await logger.metric('token_usage', result.token_usage.total_tokens, 'tokens');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          outputs: priestOutput,
          reasoning: priestOutput.strategic_analysis,
          confidence_score: priestOutput.confidence_score,
        },
        metadata: {
          service: 'priest-strategy',
          subtask_id: subtask.subtask_id,
          processing_time_ms: processingTime,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Strategy Priest error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'STRATEGY_PRIEST_ERROR',
          message: error.message,
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildContextSummary(context: any): string {
  const orgContext = context.org_context;
  const teamContexts = context.team_contexts || [];

  let summary = `User Mode: ${context.user_context.mode}\n\n`;

  if (orgContext) {
    summary += `Organization:
Name: ${orgContext.name}
Industry: ${orgContext.industry}
Size: ${orgContext.size} employees
Connected Systems: ${orgContext.connected_systems.join(', ')}

`;
  }

  if (teamContexts.length > 0) {
    summary += `Teams:\n`;
    teamContexts.forEach((team: any) => {
      summary += `- ${team.name} (${team.members.length} members, ${team.projects.length} active projects)\n`;
    });
    summary += '\n';
  }

  if (context.personal_context?.goals) {
    summary += `Professional Goals:\n`;
    context.personal_context.goals
      .filter((g: any) => g.category === 'professional' || g.category === 'org')
      .forEach((g: any) => {
        summary += `- ${g.title}\n`;
      });
  }

  return summary;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
