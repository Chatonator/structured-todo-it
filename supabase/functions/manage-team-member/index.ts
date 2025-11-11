import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type TeamRole = 'owner' | 'admin' | 'member';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
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
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { action, teamId, targetUserId, newRole } = await req.json();

    if (!action || !teamId) {
      return new Response(
        JSON.stringify({ error: 'Action and teamId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if current user is admin or owner
    const { data: currentMember } = await supabaseClient
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only admins and owners can manage members.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different actions
    if (action === 'update_role') {
      if (!targetUserId || !newRole) {
        return new Response(
          JSON.stringify({ error: 'targetUserId and newRole are required for update_role action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const validRoles: TeamRole[] = ['owner', 'admin', 'member'];
      if (!validRoles.includes(newRole)) {
        return new Response(
          JSON.stringify({ error: 'Invalid role. Must be owner, admin, or member.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get target member info
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

      // Only owner can change owner role or promote to owner
      if (targetMember.role === 'owner' || newRole === 'owner') {
        if (currentMember.role !== 'owner') {
          return new Response(
            JSON.stringify({ error: 'Only the owner can change owner role' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Update role
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
          JSON.stringify({ error: 'targetUserId is required for remove_member action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get target member info
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

      // Only owner can remove owner
      if (targetMember.role === 'owner' && currentMember.role !== 'owner') {
        return new Response(
          JSON.stringify({ error: 'Only the owner can remove the owner' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Cannot remove yourself as owner (must transfer ownership first)
      if (targetUserId === user.id && currentMember.role === 'owner') {
        return new Response(
          JSON.stringify({ error: 'Owner cannot remove themselves. Transfer ownership first.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Remove member
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
