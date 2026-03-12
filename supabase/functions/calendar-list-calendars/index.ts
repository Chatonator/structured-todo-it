import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createServiceClient, requireAuthenticatedUser } from '../_shared/supabase.ts';
import { ensureProviderAccessToken, fetchProviderCalendars, getConnection, sanitizeConnection } from '../_shared/calendar.ts';

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

    if (!connection || connection.status !== 'connected') {
      return jsonResponse({ connection: sanitizeConnection(connection, true), calendars: [] });
    }

    const accessToken = await ensureProviderAccessToken(serviceClient, connection);
    const calendars = await fetchProviderCalendars(provider, accessToken);
    return jsonResponse({ connection: sanitizeConnection(connection, true), calendars });
  } catch (caughtError) {
    return jsonResponse({ error: caughtError instanceof Error ? caughtError.message : 'Internal server error' }, { status: 500 });
  }
});
