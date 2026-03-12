import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createServiceClient, requireAuthenticatedUser } from '../_shared/supabase.ts';
import { getConnection, sanitizeConnection } from '../_shared/calendar.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { user, error } = await requireAuthenticatedUser(req);
  if (error || !user) {
    return jsonResponse({ error: error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { provider = 'outlook', calendarId, calendarName } = await req.json();
    if (!calendarId || typeof calendarId !== 'string') {
      return jsonResponse({ error: 'calendarId requis' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const connection = await getConnection(serviceClient, user.id, provider);

    if (!connection) {
      return jsonResponse({ error: 'Aucune connexion agenda trouvée' }, { status: 404 });
    }

    const { error: updateError } = await serviceClient
      .from('calendar_connections')
      .update({
        target_calendar_id: calendarId,
        target_calendar_name: typeof calendarName === 'string' ? calendarName : null,
        last_sync_error: null,
      })
      .eq('id', connection.id);

    if (updateError) {
      throw new Error(updateError.message || 'Impossible de sauvegarder le calendrier cible');
    }

    const refreshed = await getConnection(serviceClient, user.id, provider);
    return jsonResponse({ connection: sanitizeConnection(refreshed, true) });
  } catch (caughtError) {
    return jsonResponse({ error: caughtError instanceof Error ? caughtError.message : 'Internal server error' }, { status: 500 });
  }
});
