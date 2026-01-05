/**
 * Temple OS - River Service
 * Action dispatch and execution
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseClient } from '../_shared/db.ts';
import { ServiceLogger } from '../_shared/logger.ts';

serve(async (req) => {
  const startTime = Date.now();

  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const supabase = createSupabaseClient(req);
    const body = await req.json();
    const { actions } = body;

    if (!actions || actions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: { actions: [] },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const logger = new ServiceLogger(
      supabase,
      body.request_id || crypto.randomUUID(),
      actions[0].user_id || null,
      actions[0].org_id || null,
      'river'
    );

    await logger.info('River dispatching actions', { action_count: actions.length });

    const processedActions = [];

    for (const action of actions) {
      await logger.info('Processing action', {
        action_id: action.action_id,
        type: action.type,
        target_system: action.target_system,
      });

      try {
        // Store action in database
        await supabase.from('actions').insert({
          action_id: action.action_id || crypto.randomUUID(),
          request_id: body.request_id,
          user_id: action.user_id,
          org_id: action.org_id || null,
          type: action.type,
          status: 'in_progress',
          target_system: action.target_system,
          payload: action.payload,
        });

        // Dispatch action based on type
        const result = await dispatchAction(action, logger);

        // Update action status
        await supabase
          .from('actions')
          .update({
            status: result.success ? 'completed' : 'failed',
            result: result.data,
            error: result.error,
            updated_at: new Date().toISOString(),
          })
          .eq('action_id', action.action_id);

        processedActions.push({
          ...action,
          status: result.success ? 'completed' : 'failed',
          result: result.data,
          error: result.error,
        });
      } catch (error) {
        await logger.error('Action failed', {
          action_id: action.action_id,
          error: error.message,
        });

        await supabase
          .from('actions')
          .update({
            status: 'failed',
            error: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq('action_id', action.action_id);

        processedActions.push({
          ...action,
          status: 'failed',
          error: error.message,
        });
      }
    }

    await logger.metric('river_processing_time', Date.now() - startTime);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          actions: processedActions,
        },
        metadata: {
          service: 'river',
          actions_processed: processedActions.length,
          processing_time_ms: Date.now() - startTime,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('River error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'RIVER_ERROR',
          message: error.message,
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function dispatchAction(action: any, logger: ServiceLogger): Promise<any> {
  // Route to appropriate adapter based on target_system
  switch (action.target_system) {
    case 'internal':
      return await handleInternalAction(action, logger);

    case 'email':
      return await handleEmailAction(action, logger);

    case 'slack':
      return await handleSlackAction(action, logger);

    case 'jira':
      return await handleJiraAction(action, logger);

    case 'notion':
      return await handleNotionAction(action, logger);

    default:
      await logger.warn('Unknown target system', { target_system: action.target_system });
      return {
        success: false,
        error: `Unknown target system: ${action.target_system}`,
      };
  }
}

async function handleInternalAction(action: any, logger: ServiceLogger): Promise<any> {
  // Handle internal actions (e.g., create_reminder, update_goal)
  await logger.info('Handling internal action', { type: action.type });

  // In v1, just log and return success
  return {
    success: true,
    data: {
      message: `Internal action ${action.type} logged`,
      payload: action.payload,
    },
  };
}

async function handleEmailAction(action: any, logger: ServiceLogger): Promise<any> {
  // Stub for email integration
  await logger.info('Email action (stub)', { type: action.type });

  // In production, integrate with email service (SendGrid, AWS SES, etc.)
  return {
    success: true,
    data: {
      message: 'Email action stubbed',
      payload: action.payload,
    },
  };
}

async function handleSlackAction(action: any, logger: ServiceLogger): Promise<any> {
  // Stub for Slack integration
  await logger.info('Slack action (stub)', { type: action.type });

  // In production, use Slack API
  return {
    success: true,
    data: {
      message: 'Slack action stubbed',
      payload: action.payload,
    },
  };
}

async function handleJiraAction(action: any, logger: ServiceLogger): Promise<any> {
  // Stub for Jira integration
  await logger.info('Jira action (stub)', { type: action.type });

  // In production, use Jira API
  return {
    success: true,
    data: {
      message: 'Jira action stubbed',
      payload: action.payload,
    },
  };
}

async function handleNotionAction(action: any, logger: ServiceLogger): Promise<any> {
  // Stub for Notion integration
  await logger.info('Notion action (stub)', { type: action.type });

  // In production, use Notion API
  return {
    success: true,
    data: {
      message: 'Notion action stubbed',
      payload: action.payload,
    },
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
