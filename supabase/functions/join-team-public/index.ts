import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Simple in-memory rate limiting
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (!entry || now > entry.resetAt) return false;
  return entry.count >= 5;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    failedAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
  } else {
    entry.count++;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({ error: 'Trop de tentatives. Réessayez dans une minute.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { inviteCode } = await req.json();

    if (!inviteCode || typeof inviteCode !== 'string') {
      return new Response(
        JSON.stringify({ error: 'inviteCode is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Strip dashes and normalize
    const cleanCode = inviteCode.replace(/-/g, '').trim().toUpperCase();

    // Find team
    const { data: team, error: teamError } = await supabaseClient
      .from('teams')
      .select('id, name, invite_link_enabled')
      .eq('invite_code', cleanCode)
      .single();

    if (teamError || !team) {
      recordFailure(clientIp);
      return new Response(
        JSON.stringify({ error: 'Invalid invite code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!team.invite_link_enabled) {
      return new Response(
        JSON.stringify({ error: 'Les inscriptions sont désactivées pour cette équipe' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if authenticated user (optional)
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let alreadyMember = false;

    if (authHeader?.startsWith('Bearer ')) {
      const supabaseAuthClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabaseAuthClient.auth.getUser();
      if (user) {
        userId = user.id;

        // Check if already member
        const { data: existing } = await supabaseClient
          .from('team_members')
          .select('id')
          .eq('team_id', team.id)
          .eq('user_id', user.id)
          .single();

        if (existing) {
          alreadyMember = true;
        }
        // NO auto-join — user must explicitly click "Rejoindre"
      }
    }

    // Get member count
    const { count } = await supabaseClient
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', team.id);

    return new Response(
      JSON.stringify({
        success: true,
        team: { id: team.id, name: team.name, memberCount: count || 0 },
        authenticated: userId !== null,
        alreadyMember,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in join-team-public:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
