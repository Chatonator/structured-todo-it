import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a unique 8-character invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous characters
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client for auth verification (uses anon key + user token)
    const supabaseAuthClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseAuthClient.auth.getUser();
    
    // Parse request body
    const { name } = await req.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Team name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (name.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Team name must be less than 100 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const { data: existingTeam } = await supabaseClient
        .from('teams')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();

      if (!existingTeam) {
        isUnique = true;
      } else {
        inviteCode = generateInviteCode();
        attempts++;
      }
    }

    if (!isUnique) {
      console.error('Failed to generate unique invite code after 10 attempts');
      return new Response(
        JSON.stringify({ error: 'Failed to generate invite code. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create team
    const { data: team, error: teamError } = await supabaseClient
      .from('teams')
      .insert({
        name: name.trim(),
        created_by: user.id,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (teamError) {
      console.error('Error creating team:', teamError);
      return new Response(
        JSON.stringify({ error: 'Failed to create team' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add creator as owner
    const { error: memberError } = await supabaseClient
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('Error adding team owner:', memberError);
      // Rollback: delete the team
      await supabaseClient.from('teams').delete().eq('id', team.id);
      return new Response(
        JSON.stringify({ error: 'Failed to add team owner' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Team created successfully:', { teamId: team.id, userId: user.id, inviteCode });

    return new Response(
      JSON.stringify({
        success: true,
        team: {
          id: team.id,
          name: team.name,
          invite_code: team.invite_code,
          created_at: team.created_at,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in create-team:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
