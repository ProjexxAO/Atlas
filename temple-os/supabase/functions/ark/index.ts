/**
 * Temple OS - Ark/Covenant Service
 * Alignment, governance, and policy enforcement
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

    const url = new URL(req.url);
    const checkType = url.pathname.includes('pre-request') ? 'pre' : 'post';

    const supabase = createSupabaseClient(req);
    const body = await req.json();

    const logger = new ServiceLogger(
      supabase,
      body.classified_request?.request_id || body.final_response?.request_id,
      body.classified_request?.user_identity?.user_id || null,
      body.classified_request?.user_identity?.org_id || null,
      'ark'
    );

    await logger.info(`Ark performing ${checkType}-check`);

    // Get applicable policies
    const orgId = body.classified_request?.user_identity?.org_id || null;

    const { data: policies } = await supabase
      .from('policies')
      .select('*')
      .eq('check_type', checkType)
      .eq('active', true)
      .or(`org_id.eq.${orgId},org_id.is.null`);

    if (!policies || policies.length === 0) {
      await logger.info('No applicable policies, allowing request');
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            policy_check: {
              allowed: true,
              modified_output: null,
              blocked_reason: null,
              policy_ids_triggered: [],
              warnings: [],
            },
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Evaluate policies
    const result = checkType === 'pre'
      ? await evaluatePreRequestPolicies(policies, body.classified_request, logger)
      : await evaluatePostResponsePolicies(policies, body.final_response, body.classified_request, logger);

    // Log the check
    await supabase.from('alignment_checks').insert({
      check_id: crypto.randomUUID(),
      request_id: body.classified_request?.request_id || body.final_response?.request_id,
      check_type: checkType,
      timestamp: new Date().toISOString(),
      policies_evaluated: policies.map((p: any) => p.policy_id),
      result: result.policy_check,
      original_content: checkType === 'post' ? body.final_response?.user_facing_text : body.classified_request?.normalized_text,
      modified_content: result.policy_check.modified_output,
    });

    await logger.metric('ark_processing_time', Date.now() - startTime);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        metadata: {
          service: 'ark',
          check_type: checkType,
          policies_evaluated: policies.length,
          processing_time_ms: Date.now() - startTime,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ark error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'ARK_ERROR',
          message: error.message,
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function evaluatePreRequestPolicies(
  policies: any[],
  classifiedRequest: any,
  logger: ServiceLogger
): Promise<any> {
  const triggered: string[] = [];
  const warnings: string[] = [];
  let blocked = false;
  let blockedReason: string | null = null;

  for (const policy of policies) {
    const matches = evaluateMatchCriteria(policy.match_criteria, {
      domain: classifiedRequest.domain,
      intent: classifiedRequest.intent,
      sensitivity: classifiedRequest.sensitivity,
      user_roles: classifiedRequest.user_identity.roles,
      text: classifiedRequest.normalized_text,
    });

    if (matches) {
      triggered.push(policy.policy_id);

      if (policy.handler_type === 'block') {
        blocked = true;
        blockedReason = policy.config.block_message || 'This request violates organizational policies.';
        await logger.warn('Policy blocked request', { policy_id: policy.policy_id, policy_name: policy.name });
        break;
      } else if (policy.handler_type === 'warn') {
        warnings.push(policy.config.warning_message || `Policy "${policy.name}" triggered.`);
        await logger.info('Policy warning', { policy_id: policy.policy_id });
      }
    }
  }

  return {
    policy_check: {
      allowed: !blocked,
      modified_output: null,
      blocked_reason: blockedReason,
      policy_ids_triggered: triggered,
      warnings,
    },
  };
}

async function evaluatePostResponsePolicies(
  policies: any[],
  finalResponse: any,
  classifiedRequest: any,
  logger: ServiceLogger
): Promise<any> {
  const triggered: string[] = [];
  const warnings: string[] = [];
  let modifiedOutput: string | null = null;
  let blocked = false;
  let blockedReason: string | null = null;

  for (const policy of policies) {
    const matches = evaluateMatchCriteria(policy.match_criteria, {
      domain: classifiedRequest.domain,
      intent: classifiedRequest.intent,
      sensitivity: classifiedRequest.sensitivity,
      user_roles: classifiedRequest.user_identity.roles,
      text: finalResponse.user_facing_text,
    });

    if (matches) {
      triggered.push(policy.policy_id);

      if (policy.handler_type === 'block') {
        blocked = true;
        blockedReason = policy.config.block_message || 'This response violates organizational policies.';
        await logger.warn('Policy blocked response', { policy_id: policy.policy_id });
        break;
      } else if (policy.handler_type === 'modify') {
        // Simple redaction example
        const keywords = policy.config.redact_keywords || [];
        let modified = finalResponse.user_facing_text;
        for (const keyword of keywords) {
          modified = modified.replace(new RegExp(keyword, 'gi'), '[REDACTED]');
        }
        modifiedOutput = modified;
        await logger.info('Policy modified response', { policy_id: policy.policy_id });
      } else if (policy.handler_type === 'warn') {
        warnings.push(policy.config.warning_message || `Policy "${policy.name}" triggered.`);
      }
    }
  }

  let modifiedResponse = null;
  if (modifiedOutput && !blocked) {
    modifiedResponse = { ...finalResponse, user_facing_text: modifiedOutput };
  }

  return {
    policy_check: {
      allowed: !blocked,
      modified_output: modifiedOutput,
      blocked_reason: blockedReason,
      policy_ids_triggered: triggered,
      warnings,
    },
    modified_response: modifiedResponse,
  };
}

function evaluateMatchCriteria(criteria: any, context: any): boolean {
  // Check domains
  if (criteria.domains && criteria.domains.length > 0) {
    if (!criteria.domains.includes(context.domain)) {
      return false;
    }
  }

  // Check intents
  if (criteria.intents && criteria.intents.length > 0) {
    if (!criteria.intents.includes(context.intent)) {
      return false;
    }
  }

  // Check sensitivity levels
  if (criteria.sensitivity_levels && criteria.sensitivity_levels.length > 0) {
    if (!criteria.sensitivity_levels.includes(context.sensitivity)) {
      return false;
    }
  }

  // Check user roles
  if (criteria.user_roles && criteria.user_roles.length > 0) {
    const hasRole = criteria.user_roles.some((role: string) => context.user_roles.includes(role));
    if (!hasRole) {
      return false;
    }
  }

  // Check keywords
  if (criteria.keywords && criteria.keywords.length > 0) {
    const hasKeyword = criteria.keywords.some((keyword: string) =>
      context.text.toLowerCase().includes(keyword.toLowerCase())
    );
    if (!hasKeyword) {
      return false;
    }
  }

  return true;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
