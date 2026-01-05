/**
 * Temple OS - Outer Court Service
 * Entry point: Auth, classification, safety, simple QA
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseClient, getUserIdentity } from '../_shared/db.ts';
import { callLLM, generateEmbedding } from '../_shared/llm.ts';
import { ServiceLogger } from '../_shared/logger.ts';

const CLASSIFICATION_PROMPT = `You are the Outer Court classifier for Temple OS, a personal + executive AI operating system.

Your role is to classify incoming requests and determine how to route them.

Analyze the user's request and provide a JSON response with:
{
  "normalized_text": "cleaned and normalized version of the input",
  "language": "detected language code (e.g., 'en', 'es')",
  "domain": "primary domain (life, work, strategy, finance, ops, tech, people, research, learning, career, creator)",
  "intent": "primary intent (ask_question, plan, analyze, create, decide, execute, reflect)",
  "priority": "low | normal | high",
  "sensitivity": "public | internal | confidential",
  "safety_flags": ["array of any safety concerns"],
  "requires_inner_court": true/false (true if complex, needs planning, or multi-step; false if simple QA),
  "reasoning": "brief explanation of your classification"
}

For simple questions that can be answered with basic knowledge retrieval, set requires_inner_court to false.
For complex planning, strategic questions, or multi-step tasks, set requires_inner_court to true.`;

const SIMPLE_QA_PROMPT = `You are a helpful assistant in Temple OS, a personal + executive AI operating system.

Answer the user's question directly and concisely using the provided context.

Context:
{context}

User Question:
{question}

Provide a clear, helpful answer.`;

serve(async (req) => {
  const startTime = Date.now();

  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const supabase = createSupabaseClient(req);
    const userIdentity = await getUserIdentity(supabase);

    const body = await req.json();
    const rawRequest = body.raw_request;

    // Generate request ID if not provided
    const request_id = rawRequest.request_id || crypto.randomUUID();

    const logger = new ServiceLogger(
      supabase,
      request_id,
      userIdentity.user_id,
      userIdentity.org_id,
      'outer-court'
    );

    await logger.info('Outer Court processing request', {
      channel: rawRequest.channel,
      mode: userIdentity.mode,
    });

    // Store the raw request
    await supabase.from('requests').insert({
      request_id,
      user_id: userIdentity.user_id,
      org_id: userIdentity.org_id,
      team_id: userIdentity.active_team_id,
      timestamp: rawRequest.timestamp || new Date().toISOString(),
      channel: rawRequest.channel,
      raw_input: rawRequest.raw_input,
      metadata: rawRequest.metadata,
    });

    // Extract text input
    const inputText = typeof rawRequest.raw_input === 'string'
      ? rawRequest.raw_input
      : rawRequest.raw_input.text || '';

    // Call LLM for classification
    const classificationResult = await callLLM({
      model: 'gpt-4-turbo-preview',
      system_prompt: CLASSIFICATION_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Classify this request:\n\n"${inputText}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const classification = JSON.parse(classificationResult.parsed_content as string);

    await logger.info('Request classified', {
      domain: classification.domain,
      intent: classification.intent,
      requires_inner_court: classification.requires_inner_court,
    });

    // Build classified request
    const classifiedRequest = {
      request_id,
      user_identity: userIdentity,
      normalized_text: classification.normalized_text,
      language: classification.language,
      preferred_language: userIdentity.auth_context.preferred_language || 'en',
      ui_locale: userIdentity.auth_context.ui_locale || 'en-US',
      domain: classification.domain,
      intent: classification.intent,
      priority: classification.priority,
      sensitivity: classification.sensitivity,
      safety_flags: classification.safety_flags || [],
      requires_inner_court: classification.requires_inner_court,
      attachments: rawRequest.attachments || [],
    };

    // Store classified request
    await supabase.from('classified_requests').insert({
      request_id,
      user_id: userIdentity.user_id,
      org_id: userIdentity.org_id,
      ...classifiedRequest,
    });

    // Safety check
    if (classifiedRequest.safety_flags.length > 0) {
      await logger.warn('Safety flags detected', { flags: classifiedRequest.safety_flags });
      // In production, route to Ark for pre-check
    }

    // If simple request, handle with QA
    if (!classifiedRequest.requires_inner_court) {
      await logger.info('Handling as simple QA');

      // Retrieve relevant context using embeddings
      const embedding = await generateEmbedding(inputText);

      const { data: memories } = await supabase.rpc('match_memory_items', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: 5,
        filter_user_id: userIdentity.user_id,
      });

      const context = memories?.map((m: any) => m.content).join('\n\n') || 'No relevant context found.';

      // Generate answer
      const qaResult = await callLLM({
        model: 'gpt-4-turbo-preview',
        system_prompt: SIMPLE_QA_PROMPT.replace('{context}', context).replace('{question}', inputText),
        messages: [
          {
            role: 'user',
            content: inputText,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const finalResponse = {
        request_id,
        user_facing_text: qaResult.parsed_content as string,
        structured_output: null,
        explanations: {
          handled_by: 'outer_court_qa',
          context_used: memories?.length || 0,
        },
        actions_triggered: [],
      };

      // Store response
      await supabase.from('final_responses').insert({
        response_id: crypto.randomUUID(),
        request_id,
        user_id: userIdentity.user_id,
        org_id: userIdentity.org_id,
        ...finalResponse,
      });

      const processingTime = Date.now() - startTime;
      await logger.metric('outer_court_processing_time', processingTime);
      await logger.metric('token_usage', qaResult.token_usage.total_tokens, 'tokens');

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            next_step: 'complete',
            final_response: finalResponse,
          },
          metadata: {
            service: 'outer-court',
            request_id,
            processing_time_ms: processingTime,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Complex request - route to Inner Court
    await logger.info('Routing to Inner Court');

    const processingTime = Date.now() - startTime;
    await logger.metric('outer_court_processing_time', processingTime);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          next_step: 'inner_court',
          classified_request: classifiedRequest,
        },
        metadata: {
          service: 'outer-court',
          request_id,
          processing_time_ms: processingTime,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Outer Court error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'OUTER_COURT_ERROR',
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
