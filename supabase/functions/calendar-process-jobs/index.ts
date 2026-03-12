import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { processCalendarJobsForUser } from '../_shared/calendar.ts';
import { createServiceClient, requireAuthenticatedUser } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { user, error } = await requireAuthenticatedUser(req);
  if (error || !user) {
    return jsonResponse({ error: error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { provider = 'outlook', limit = 20 } = await req.json().catch(() => ({}));
    const serviceClient = createServiceClient();
    const result = await processCalendarJobsForUser(serviceClient, user.id, provider, Number(limit) || 20);
    return jsonResponse(result);
  } catch (caughtError) {
    return jsonResponse({ error: caughtError instanceof Error ? caughtError.message : 'Internal server error' }, { status: 500 });
  }
});
