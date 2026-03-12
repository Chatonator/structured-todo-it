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
    const serviceClient = createServiceClient();
    const outlookConnection = await getConnection(serviceClient, user.id, 'outlook');

    return jsonResponse({
      providers: {
        outlook: sanitizeConnection(outlookConnection, true),
        google: {
          provider: 'google',
          status: 'disconnected',
          connected: false,
          available: false,
          accountEmail: null,
          accountLabel: null,
          targetCalendarId: null,
          targetCalendarName: null,
          lastSyncedAt: null,
          lastSyncError: 'Connecteur bientôt disponible',
          scopes: [],
        },
      },
    });
  } catch (caughtError) {
    return jsonResponse({ error: caughtError instanceof Error ? caughtError.message : 'Internal server error' }, { status: 500 });
  }
});
