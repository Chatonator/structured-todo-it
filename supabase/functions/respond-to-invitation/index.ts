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

    const { invitationId, accept } = await req.json();

    if (!invitationId || typeof accept !== 'boolean') {
      return new Response(JSON.stringify({ error: 'invitationId and accept (boolean) are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('team_invitations')
      .select('*, teams(name)')
      .eq('id', invitationId)
      .eq('invited_user_id', userId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !invitation) {
      return new Response(JSON.stringify({ error: 'Invitation not found or already responded' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newStatus = accept ? 'accepted' : 'declined';

    // Update invitation status
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({ status: newStatus, responded_at: new Date().toISOString() })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update invitation' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (accept) {
      // Add user as team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: invitation.team_id,
          user_id: userId,
          role: 'member',
        });

      if (memberError) {
        console.error('Error adding team member:', memberError);
        // Rollback invitation status
        await supabase
          .from('team_invitations')
          .update({ status: 'pending', responded_at: null })
          .eq('id', invitationId);
        return new Response(JSON.stringify({ error: 'Failed to join team' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get the user's display name
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', userId)
        .single();

      const userName = userProfile?.display_name || 'Un utilisateur';

      // Notify the inviter
      await supabase.from('notifications').insert({
        user_id: invitation.invited_by,
        type: 'team',
        title: `${userName} a rejoint l'équipe`,
        message: `${userName} a accepté votre invitation à rejoindre "${invitation.teams?.name || 'l\'équipe'}".`,
        metadata: {
          team_id: invitation.team_id,
          action: 'invitation_accepted',
        },
      });
    } else {
      // Notify inviter of decline
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', userId)
        .single();

      const userName = userProfile?.display_name || 'Un utilisateur';

      await supabase.from('notifications').insert({
        user_id: invitation.invited_by,
        type: 'team',
        title: `Invitation refusée`,
        message: `${userName} a refusé votre invitation à rejoindre "${invitation.teams?.name || 'l\'équipe'}".`,
        metadata: {
          team_id: invitation.team_id,
          action: 'invitation_declined',
        },
      });
    }

    return new Response(JSON.stringify({ success: true, status: newStatus }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in respond-to-invitation:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
