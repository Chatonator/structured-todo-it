import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createServiceClient, requireAuthenticatedUser } from '../_shared/supabase.ts';
import { queueFullResyncForUser, processCalendarJobsForUser } from '../_shared/calendar.ts';

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
    const { connection, queued } = await queueFullResyncForUser(serviceClient, user.id, provider);

    if (!connection) {
      return jsonResponse({ error: 'Aucune connexion agenda trouvée' }, { status: 404 });
    }

    const result = await processCalendarJobsForUser(serviceClient, user.id, provider, Math.max(20, queued));
    return jsonResponse({ queued, ...result });
  } catch (caughtError) {
    return jsonResponse({ error: caughtError instanceof Error ? caughtError.message : 'Internal server error' }, { status: 500 });
  }
});

