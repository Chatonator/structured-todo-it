import { createServiceClient } from '../_shared/supabase.ts';
import {
  encryptSecret,
  exchangeCodeForTokens,
  fetchProviderCalendars,
  fetchProviderProfile,
  getAppUrl,
  processCalendarJobsForUser,
  queueFullResyncForUser,
} from '../_shared/calendar.ts';

function redirectTo(url: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: url },
  });
}

function buildRedirectTarget(baseUrl: string, status: 'connected' | 'error', provider: string, message?: string) {
  const url = new URL(baseUrl);
  url.searchParams.set('calendar_provider', provider);
  url.searchParams.set('calendar_status', status);
  if (message) {
    url.searchParams.set('calendar_message', message);
  }
  return url.toString();
}

Deno.serve(async (req) => {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const provider = (requestUrl.searchParams.get('provider') || 'outlook') as 'outlook';
  const fallbackRedirect = `${getAppUrl().replace(/\/$/, '')}/#/`;

  if (!code || !state) {
    return redirectTo(buildRedirectTarget(fallbackRedirect, 'error', provider, 'Paramètres OAuth manquants'));
  }

  const serviceClient = createServiceClient();

  try {
    const { data: stateRow, error: stateError } = await serviceClient
      .from('calendar_oauth_states')
      .select('*')
      .eq('state', state)
      .eq('provider', provider)
      .maybeSingle();

    if (stateError || !stateRow) {
      throw new Error('État OAuth invalide ou expiré');
    }

    if (new Date(stateRow.expires_at).getTime() < Date.now()) {
      throw new Error('La connexion agenda a expiré, relancez l opération');
    }

    const redirectAfter = typeof stateRow.redirect_after === 'string' && stateRow.redirect_after
      ? stateRow.redirect_after
      : fallbackRedirect;

    const tokenResponse = await exchangeCodeForTokens(provider, code);
    const accessTokenCiphertext = await encryptSecret(tokenResponse.access_token);
    const refreshTokenCiphertext = tokenResponse.refresh_token
      ? await encryptSecret(tokenResponse.refresh_token)
      : null;
    const tokenExpiresAt = new Date(Date.now() + Number(tokenResponse.expires_in || 3600) * 1000).toISOString();
    const profile = await fetchProviderProfile(provider, tokenResponse.access_token);
    const calendars = await fetchProviderCalendars(provider, tokenResponse.access_token);
    const defaultCalendar = calendars.find((calendar) => calendar.isDefault) || calendars[0] || null;

    const { error: upsertError } = await serviceClient.from('calendar_connections').upsert({
      user_id: stateRow.user_id,
      provider,
      status: 'connected',
      account_email: profile.mail || profile.userPrincipalName || null,
      account_label: profile.displayName || profile.mail || profile.userPrincipalName || 'Compte Outlook',
      target_calendar_id: defaultCalendar?.id || null,
      target_calendar_name: defaultCalendar?.name || null,
      access_token_ciphertext: accessTokenCiphertext,
      refresh_token_ciphertext: refreshTokenCiphertext,
      token_expires_at: tokenExpiresAt,
      scopes: tokenResponse.scope ? String(tokenResponse.scope).split(' ') : [],
      metadata: {
        provider: 'outlook',
        calendars_loaded_at: new Date().toISOString(),
      },
      last_sync_error: null,
    }, { onConflict: 'user_id,provider' });

    if (upsertError) {
      throw new Error(upsertError.message || 'Impossible de sauvegarder la connexion agenda');
    }

    await serviceClient.from('calendar_oauth_states').delete().eq('id', stateRow.id);
    const { queued } = await queueFullResyncForUser(serviceClient, stateRow.user_id, provider);
    if (queued > 0) {
      await processCalendarJobsForUser(serviceClient, stateRow.user_id, provider, Math.max(20, queued));
    }
    return redirectTo(buildRedirectTarget(redirectAfter, 'connected', provider, queued > 0 ? 'Connexion terminée et première synchro lancée.' : undefined));
  } catch (caughtError) {
    return redirectTo(buildRedirectTarget(fallbackRedirect, 'error', provider, caughtError instanceof Error ? caughtError.message : 'Erreur inconnue'));
  }
});


