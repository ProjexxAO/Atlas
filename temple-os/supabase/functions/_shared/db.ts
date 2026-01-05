/**
 * Shared database utilities for Temple OS Edge Functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function createSupabaseClient(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Get the Authorization header from the request
  const authHeader = req.headers.get('Authorization');

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

export async function getUserIdentity(supabase: any): Promise<any> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  // Get user's org and team memberships
  const { data: userOrgs } = await supabase
    .from('user_orgs')
    .select('org_id, roles, permissions')
    .eq('user_id', user.id);

  const { data: teamMemberships } = await supabase
    .from('team_memberships')
    .select('team_id, role')
    .eq('user_id', user.id);

  // Determine mode based on context (can be enhanced with request params)
  const mode = userOrgs && userOrgs.length > 0 ? 'org' : 'personal';

  return {
    user_id: user.id,
    org_id: userOrgs?.[0]?.org_id || null,
    active_team_id: teamMemberships?.[0]?.team_id || null,
    active_org_id: userOrgs?.[0]?.org_id || null,
    roles: userOrgs?.[0]?.roles || ['individual'],
    permissions: userOrgs?.[0]?.permissions || [],
    mode,
    auth_context: { email: user.email },
  };
}
