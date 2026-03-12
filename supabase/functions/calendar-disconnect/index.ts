import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createServiceClient, requireAuthenticatedUser } from '../_shared/supabase.ts';
import { getConnection } from '../_shared/calendar.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { user, error } = await requireAuthenticatedUser(req);
  if (error || !user) {
    return jsonResponse({ error: error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { provider = 'outlook' } = await req.json().catch(() => ({}));
    const serviceClient = createServiceClient();
    const connection = await getConnection(serviceClient, user.id, provider);

    if (!connection) {
      return jsonResponse({ success: true });
    }

    await serviceClient.from('calendar_event_links').delete().eq('connection_id', connection.id);
    const { error: updateError } = await serviceClient
      .from('calendar_connections')
      .update({
        status: 'disconnected',
        account_email: null,
        account_label: null,
        target_calendar_id: null,
        target_calendar_name: null,
        access_token_ciphertext: null,
        refresh_token_ciphertext: null,
        token_expires_at: null,
        scopes: [],
        metadata: {},
        last_synced_at: null,
        last_sync_error: null,
      })
      .eq('id', connection.id);

    if (updateError) {
      throw new Error(updateError.message || 'Impossible de déconnecter le compte agenda');
    }

    return jsonResponse({ success: true });
  } catch (caughtError) {
    return jsonResponse({ error: caughtError instanceof Error ? caughtError.message : 'Internal server error' }, { status: 500 });
  }
});

