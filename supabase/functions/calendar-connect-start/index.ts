import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { buildAuthorizeUrl } from '../_shared/calendar.ts';
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
    const { provider = 'outlook', redirectAfter = null } = await req.json().catch(() => ({}));
    if (provider !== 'outlook') {
      return jsonResponse({ error: 'Seul Outlook est activé pour le moment.' }, { status: 400 });
    }

    const state = crypto.randomUUID();
    const serviceClient = createServiceClient();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: stateError } = await serviceClient.from('calendar_oauth_states').insert({
      state,
      user_id: user.id,
      provider,
      redirect_after: typeof redirectAfter === 'string' ? redirectAfter : null,
      expires_at: expiresAt,
    });

    if (stateError) {
      throw new Error(stateError.message || 'Impossible de préparer la connexion agenda');
    }

    return jsonResponse({ url: buildAuthorizeUrl(provider, state) });
  } catch (caughtError) {
    return jsonResponse({ error: caughtError instanceof Error ? caughtError.message : 'Internal server error' }, { status: 500 });
  }
});
