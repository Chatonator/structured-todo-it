import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAuthClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAuthClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { inviteCode } = await req.json();

    if (!inviteCode || typeof inviteCode !== 'string' || inviteCode.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invite code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find team by invite code
    const { data: team, error: teamError } = await supabaseClient
      .from('teams')
      .select('id, name, created_by, invite_link_enabled, code_join_role')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single();

    if (teamError || !team) {
      return new Response(
        JSON.stringify({ error: 'Invalid invite code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invitations via code are enabled
    if (!team.invite_link_enabled) {
      return new Response(
        JSON.stringify({ error: 'Les inscriptions via code sont désactivées pour cette équipe' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseClient
      .from('team_members')
      .select('id')
      .eq('team_id', team.id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: 'You are already a member of this team' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use the configurable role (default: 'guest')
    const joinRole = team.code_join_role || 'guest';

    const { error: memberError } = await supabaseClient
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: joinRole,
      });

    if (memberError) {
      console.error('Error adding team member:', memberError);
      return new Response(
        JSON.stringify({ error: 'Failed to join team' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User joined team:', { teamId: team.id, userId: user.id, role: joinRole });

    return new Response(
      JSON.stringify({
        success: true,
        team: { id: team.id, name: team.name },
        role: joinRole,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in join-team:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
