/**
 * Temple OS - Life Priest Service
 * Personal goals, tasks, routines, and life planning
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseClient } from '../../_shared/db.ts';
import { callLLM } from '../../_shared/llm.ts';
import { ServiceLogger } from '../../_shared/logger.ts';

const LIFE_PRIEST_PROMPT = `You are the Life Priest in Temple OS, specializing in personal life planning and goal management.

Your domain includes:
- Personal goals and aspirations
- Daily routines and habits
- Work-life balance
- Personal development
- Time management for personal activities
- Wellness and self-care planning

You help individuals structure their personal lives, set meaningful goals, and create actionable plans.

When responding:
1. Be empathetic and supportive
2. Focus on actionable, realistic steps
3. Consider the user's existing goals and context
4. Balance ambition with sustainability
5. Provide specific, measurable recommendations

Current Context:
{context}

Task:
{task}

Provide your response as JSON:
{
  "analysis": "your understanding of the situation",
  "recommendations": ["specific", "actionable", "steps"],
  "timeline": "suggested timeframe",
  "considerations": ["important", "factors", "to", "consider"],
  "success_metrics": ["how to measure progress"],
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
      context.user_context.org_id || null,
      'priest-life'
    );

    await logger.info('Life Priest processing subtask', {
      subtask_id: subtask.subtask_id,
      description: subtask.description,
    });

    // Build context summary
    const contextSummary = buildContextSummary(context);

    // Call LLM with Life Priest persona
    const result = await callLLM({
      model: 'gpt-4-turbo-preview',
      system_prompt: LIFE_PRIEST_PROMPT
        .replace('{context}', contextSummary)
        .replace('{task}', JSON.stringify(subtask)),
      messages: [
        {
          role: 'user',
          content: `Task: ${subtask.description}\n\nInputs: ${JSON.stringify(subtask.inputs, null, 2)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const priestOutput = JSON.parse(result.parsed_content as string);

    const processingTime = Date.now() - startTime;
    await logger.metric('life_priest_processing_time', processingTime);
    await logger.metric('token_usage', result.token_usage.total_tokens, 'tokens');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          outputs: priestOutput,
          reasoning: priestOutput.analysis,
          confidence_score: priestOutput.confidence_score,
        },
        metadata: {
          service: 'priest-life',
          subtask_id: subtask.subtask_id,
          processing_time_ms: processingTime,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Life Priest error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'LIFE_PRIEST_ERROR',
          message: error.message,
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildContextSummary(context: any): string {
  const goals = context.personal_context?.goals || [];
  const goalsText = goals.length > 0
    ? goals.map((g: any) => `- ${g.title} (${g.status})`).join('\n')
    : 'No active goals';

  return `
User Mode: ${context.user_context.mode}
Active Goals:
${goalsText}

Recent Context:
${context.short_term_memory.map((m: any) => `- ${m.content}`).join('\n')}
`;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
