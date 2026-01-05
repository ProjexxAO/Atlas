/**
 * Temple OS - Memory & Storehouse Service
 * Memory storage and retrieval
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseClient } from '../_shared/db.ts';
import { generateEmbedding } from '../_shared/llm.ts';
import { ServiceLogger } from '../_shared/logger.ts';

serve(async (req) => {
  const startTime = Date.now();

  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();

    const supabase = createSupabaseClient(req);
    const body = await req.json();

    const logger = new ServiceLogger(
      supabase,
      body.request_id || crypto.randomUUID(),
      body.user_id || null,
      body.org_id || null,
      'memory'
    );

    if (endpoint === 'store-event') {
      return await storeEvent(supabase, body, logger, startTime);
    } else if (endpoint === 'retrieve-context') {
      return await retrieveContext(supabase, body, logger, startTime);
    } else if (endpoint === 'update-user-profile') {
      return await updateUserProfile(supabase, body, logger, startTime);
    } else {
      throw new Error('Unknown endpoint');
    }
  } catch (error) {
    console.error('Memory service error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'MEMORY_ERROR',
          message: error.message,
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function storeEvent(
  supabase: any,
  body: any,
  logger: ServiceLogger,
  startTime: number
): Promise<Response> {
  await logger.info('Storing memory event', { event_type: body.event_type });

  // Generate embedding for the content
  const embedding = await generateEmbedding(body.content);

  // Store memory item
  const { data, error } = await supabase.from('memory_items').insert({
    memory_id: crypto.randomUUID(),
    user_id: body.user_id,
    org_id: body.org_id || null,
    team_id: body.team_id || null,
    type: body.event_type,
    content: body.content,
    embedding_vector: embedding,
    metadata: body.metadata || {},
  }).select().single();

  if (error) {
    throw new Error(`Failed to store memory: ${error.message}`);
  }

  await logger.metric('memory_store_time', Date.now() - startTime);

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        memory_id: data.memory_id,
      },
      metadata: {
        service: 'memory',
        operation: 'store-event',
        processing_time_ms: Date.now() - startTime,
      },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function retrieveContext(
  supabase: any,
  body: any,
  logger: ServiceLogger,
  startTime: number
): Promise<Response> {
  await logger.info('Retrieving context', { user_id: body.user_id });

  let memories: any[] = [];

  if (body.query) {
    // Semantic search using embeddings
    const queryEmbedding = await generateEmbedding(body.query);

    const { data, error } = await supabase.rpc('match_memory_items', {
      query_embedding: queryEmbedding,
      match_threshold: body.threshold || 0.7,
      match_count: body.limit || 10,
      filter_user_id: body.user_id,
      filter_org_id: body.org_id || null,
      filter_team_id: body.team_id || null,
    });

    if (!error) {
      memories = data || [];
    }
  } else {
    // Recent memories
    let query = supabase
      .from('memory_items')
      .select('*')
      .eq('user_id', body.user_id)
      .order('created_at', { ascending: false })
      .limit(body.limit || 10);

    if (body.org_id) {
      query = query.eq('org_id', body.org_id);
    }

    if (body.team_id) {
      query = query.eq('team_id', body.team_id);
    }

    if (body.memory_types && body.memory_types.length > 0) {
      query = query.in('type', body.memory_types);
    }

    const { data, error } = await query;

    if (!error) {
      memories = data || [];
    }
  }

  await logger.metric('memory_retrieve_time', Date.now() - startTime);

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        memories,
        count: memories.length,
      },
      metadata: {
        service: 'memory',
        operation: 'retrieve-context',
        processing_time_ms: Date.now() - startTime,
      },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateUserProfile(
  supabase: any,
  body: any,
  logger: ServiceLogger,
  startTime: number
): Promise<Response> {
  await logger.info('Updating user profile', { user_id: body.user_id });

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      preferences: body.preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', body.user_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  await logger.metric('memory_profile_update_time', Date.now() - startTime);

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        profile: data,
      },
      metadata: {
        service: 'memory',
        operation: 'update-user-profile',
        processing_time_ms: Date.now() - startTime,
      },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
