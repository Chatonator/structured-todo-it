import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type TeamRole = 'owner' | 'admin' | 'supervisor' | 'member' | 'guest';

const ROLE_LEVEL: Record<TeamRole, number> = {
  owner: 4,
  admin: 3,
  supervisor: 2,
  member: 1,
  guest: 0,
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

    const { action, teamId, targetUserId, newRole } = await req.json();

    if (!action || !teamId) {
      return new Response(
        JSON.stringify({ error: 'Action and teamId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current user's role
    const { data: currentMember } = await supabaseClient
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (!currentMember) {
      return new Response(
        JSON.stringify({ error: 'You are not a member of this team' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentLevel = ROLE_LEVEL[currentMember.role as TeamRole] ?? 0;

    // Must be at least admin level to manage members
    if (currentLevel < ROLE_LEVEL.admin) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only admins and above can manage members.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_role') {
      if (!targetUserId || !newRole) {
        return new Response(
          JSON.stringify({ error: 'targetUserId and newRole are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const validRoles: TeamRole[] = ['owner', 'admin', 'supervisor', 'member', 'guest'];
      if (!validRoles.includes(newRole)) {
        return new Response(
          JSON.stringify({ error: 'Invalid role.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: targetMember } = await supabaseClient
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', targetUserId)
        .single();

      if (!targetMember) {
        return new Response(
          JSON.stringify({ error: 'Target user is not a member of this team' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const targetLevel = ROLE_LEVEL[targetMember.role as TeamRole] ?? 0;
      const newRoleLevel = ROLE_LEVEL[newRole as TeamRole] ?? 0;

      // Rule: can only act on members with STRICTLY lower rank
      if (currentLevel <= targetLevel) {
        return new Response(
          JSON.stringify({ error: 'You can only modify members with a lower rank than yours.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Rule: can only promote up to STRICTLY below own rank
      if (newRoleLevel >= currentLevel) {
        return new Response(
          JSON.stringify({ error: 'You can only assign roles strictly below your own rank.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: updateError } = await supabaseClient
        .from('team_members')
        .update({ role: newRole })
        .eq('team_id', teamId)
        .eq('user_id', targetUserId);

      if (updateError) {
        console.error('Error updating member role:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update member role' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Member role updated:', { teamId, targetUserId, newRole, updatedBy: user.id });

      return new Response(
        JSON.stringify({ success: true, message: 'Member role updated successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'remove_member') {
      if (!targetUserId) {
        return new Response(
          JSON.stringify({ error: 'targetUserId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: targetMember } = await supabaseClient
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', targetUserId)
        .single();

      if (!targetMember) {
        return new Response(
          JSON.stringify({ error: 'Target user is not a member of this team' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const targetLevel = ROLE_LEVEL[targetMember.role as TeamRole] ?? 0;

      // Rule: can only remove members with STRICTLY lower rank
      if (currentLevel <= targetLevel) {
        return new Response(
          JSON.stringify({ error: 'You can only remove members with a lower rank than yours.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Cannot remove yourself as owner
      if (targetUserId === user.id && currentMember.role === 'owner') {
        return new Response(
          JSON.stringify({ error: 'Owner cannot remove themselves. Transfer ownership first.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: removeError } = await supabaseClient
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', targetUserId);

      if (removeError) {
        console.error('Error removing member:', removeError);
        return new Response(
          JSON.stringify({ error: 'Failed to remove member' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Member removed from team:', { teamId, targetUserId, removedBy: user.id });

      return new Response(
        JSON.stringify({ success: true, message: 'Member removed successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be update_role or remove_member.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Unexpected error in manage-team-member:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
