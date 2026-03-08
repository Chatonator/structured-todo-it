import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub as string;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { teamId, email } = await req.json();

    if (!teamId || !email) {
      return new Response(JSON.stringify({ error: 'teamId and email are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify inviter is admin/owner
    const { data: isAdmin } = await supabase.rpc('is_team_admin', {
      _user_id: userId, _team_id: teamId,
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Only admins can invite members' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get team name
    const { data: team } = await supabase.from('teams').select('name').eq('id', teamId).single();

    // Find user by email in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'No user found with this email' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', profile.user_id)
      .single();

    if (existingMember) {
      return new Response(JSON.stringify({ error: 'This user is already a team member' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('team_id', teamId)
      .eq('invited_user_id', profile.user_id)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return new Response(JSON.stringify({ error: 'An invitation is already pending for this user' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get inviter name
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', userId)
      .single();

    const inviterName = inviterProfile?.display_name || 'Un membre';

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        invited_by: userId,
        invited_email: email.toLowerCase().trim(),
        invited_user_id: profile.user_id,
        status: 'pending',
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return new Response(JSON.stringify({ error: 'Failed to create invitation' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create notification for invited user
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: profile.user_id,
      type: 'team',
      title: `Invitation à rejoindre "${team?.name || 'une équipe'}"`,
      message: `${inviterName} vous invite à rejoindre l'équipe "${team?.name}". Rendez-vous dans la section Équipe pour accepter ou refuser.`,
      metadata: {
        invitation_id: invitation.id,
        team_id: teamId,
        team_name: team?.name,
        invited_by: userId,
        inviter_name: inviterName,
        action: 'team_invitation',
      },
    });

    if (notifError) {
      console.error('Error creating notification:', notifError);
    }

    return new Response(JSON.stringify({ success: true, invitation }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in invite-to-team:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
