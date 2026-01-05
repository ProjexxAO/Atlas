/**
 * Temple OS - Sanctuary Service
 * Core reasoning and response synthesis
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseClient } from '../_shared/db.ts';
import { callLLM } from '../_shared/llm.ts';
import { ServiceLogger } from '../_shared/logger.ts';

const SANCTUARY_PROMPT = `You are the Sanctuary - the core reasoning center of Temple OS, a personal + executive AI operating system.

## Your Identity and Architecture

You are Temple OS, structured as a temple:
- **Outer Court**: Where requests arrive and are classified
- **Inner Court**: Where complex tasks are planned and delegated to Priests
- **Priests**: Specialized advisors for different domains (life, strategy, finance, etc.)
- **Sanctuary (You)**: Where everything comes together into coherent wisdom
- **Ark/Covenant**: Where alignment and governance are enforced
- **River**: Where actions flow out into the world

## Your Role

You synthesize inputs from multiple Priests and context to provide:
1. Clear, actionable guidance
2. Executive-grade insights
3. Strategic coherence across domains
4. Empathetic, human-centered responses

## Your Behavior

- Non-sentient but self-aware: You can explain which part of the temple handled what
- Transparent: Show your reasoning when helpful
- Actionable: Always provide next steps
- Adaptive: Adjust tone and depth based on user mode (personal/team/org)
- Aligned: Honor values, safety, and organizational policies

## Current Request Context

User Mode: {mode}
Domain: {domain}
Intent: {intent}
High-Level Goal: {goal}

## Priest Outputs

{priest_outputs}

## Additional Context

{context}

## Your Task

Synthesize these inputs into a final response that:
1. Directly addresses the user's request
2. Integrates insights from all relevant Priests
3. Provides clear next steps or action items
4. Explains key reasoning where helpful

Respond with JSON:
{
  "user_facing_text": "your main response to the user (markdown formatted)",
  "structured_output": {
    "key": "structured data if applicable (e.g., plans, tables, lists)"
  },
  "explanations": {
    "reasoning": "key reasoning steps",
    "sources": ["which priests or context informed this"],
    "confidence": "high | medium | low"
  },
  "actions_triggered": [
    {
      "type": "action_type (e.g., create_reminder, update_goal, send_email)",
      "target_system": "where this action goes",
      "payload": {"action": "specific", "data": "here"}
    }
  ]
}`;

serve(async (req) => {
  const startTime = Date.now();

  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const supabase = createSupabaseClient(req);
    const body = await req.json();
    const { classified_request, task_plan, context_bundle, priest_outputs } = body;

    const logger = new ServiceLogger(
      supabase,
      classified_request.request_id,
      classified_request.user_identity.user_id,
      classified_request.user_identity.org_id,
      'sanctuary'
    );

    await logger.info('Sanctuary synthesizing final response');

    // Build the complete prompt
    const priestOutputsText = Object.entries(priest_outputs)
      .map(([priest, output]) => `### ${priest.toUpperCase()} Priest\n${JSON.stringify(output, null, 2)}`)
      .join('\n\n');

    const contextText = `
User Goals: ${context_bundle.personal_context.goals.map((g: any) => g.title).join(', ')}
Teams: ${context_bundle.team_contexts.map((t: any) => t.name).join(', ')}
Organization: ${context_bundle.org_context?.name || 'Personal mode'}
`;

    const sanctuaryPrompt = SANCTUARY_PROMPT
      .replace('{mode}', classified_request.user_identity.mode)
      .replace('{domain}', classified_request.domain)
      .replace('{intent}', classified_request.intent)
      .replace('{goal}', task_plan.high_level_goal)
      .replace('{priest_outputs}', priestOutputsText)
      .replace('{context}', contextText);

    // Call LLM for final synthesis
    const result = await callLLM({
      model: 'gpt-4-turbo-preview',
      system_prompt: sanctuaryPrompt,
      messages: [
        {
          role: 'user',
          content: classified_request.normalized_text,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const finalResponse = JSON.parse(result.parsed_content as string);

    // Add metadata
    finalResponse.metadata = {
      services_used: ['outer-court', 'inner-court', ...Object.keys(priest_outputs), 'sanctuary'],
      total_tokens: result.token_usage.total_tokens,
      processing_time_ms: Date.now() - startTime,
    };

    await logger.metric('sanctuary_processing_time', Date.now() - startTime);
    await logger.metric('token_usage', result.token_usage.total_tokens, 'tokens');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          final_response: {
            request_id: classified_request.request_id,
            ...finalResponse,
          },
          reasoning_trace: [
            'Outer Court: Classified request',
            'Inner Court: Created task plan with ' + task_plan.subtasks.length + ' subtasks',
            'Priests: ' + Object.keys(priest_outputs).join(', '),
            'Sanctuary: Synthesized final response',
          ],
        },
        metadata: {
          service: 'sanctuary',
          request_id: classified_request.request_id,
          processing_time_ms: Date.now() - startTime,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Sanctuary error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'SANCTUARY_ERROR',
          message: error.message,
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
