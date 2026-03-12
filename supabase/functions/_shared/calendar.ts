export type CalendarProvider = 'outlook' | 'google';

export interface CalendarConnectionRow {
  id: string;
  user_id: string;
  provider: CalendarProvider;
  status: 'pending' | 'connected' | 'disconnected' | 'error';
  account_email: string | null;
  account_label: string | null;
  target_calendar_id: string | null;
  target_calendar_name: string | null;
  access_token_ciphertext: string | null;
  refresh_token_ciphertext: string | null;
  token_expires_at: string | null;
  scopes: string[];
  metadata: Record<string, unknown>;
  last_synced_at: string | null;
  last_sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface SafeCalendarConnection {
  provider: CalendarProvider;
  status: CalendarConnectionRow['status'];
  connected: boolean;
  available: boolean;
  accountEmail: string | null;
  accountLabel: string | null;
  targetCalendarId: string | null;
  targetCalendarName: string | null;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  scopes: string[];
}

export interface ProviderCalendar {
  id: string;
  name: string;
  isDefault: boolean;
  canEdit: boolean;
  color: string | null;
}

const MICROSOFT_SCOPES = [
  'openid',
  'profile',
  'offline_access',
  'User.Read',
  'Calendars.ReadWrite',
];

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function getMicrosoftTenantId() {
  return Deno.env.get('MICROSOFT_TENANT_ID') || 'common';
}

function getMicrosoftBaseUrl() {
  return `https://login.microsoftonline.com/${getMicrosoftTenantId()}/oauth2/v2.0`;
}

function getFunctionBaseUrl() {
  return `${requireEnv('SUPABASE_URL')}/functions/v1`;
}

export function getCalendarCallbackUrl() {
  return `${getFunctionBaseUrl()}/calendar-connect-callback`;
}

export function getAppUrl() {
  return requireEnv('APP_URL');
}

function ensureSupportedProvider(provider: CalendarProvider) {
  if (provider === 'google') {
    throw new Error('Google Calendar n est pas encore active dans cette version.');
  }
}

export function getProviderScopes(provider: CalendarProvider) {
  ensureSupportedProvider(provider);
  return [...MICROSOFT_SCOPES];
}

export function buildAuthorizeUrl(provider: CalendarProvider, state: string) {
  ensureSupportedProvider(provider);
  const params = new URLSearchParams({
    client_id: requireEnv('MICROSOFT_CLIENT_ID'),
    response_type: 'code',
    redirect_uri: getCalendarCallbackUrl(),
    response_mode: 'query',
    scope: MICROSOFT_SCOPES.join(' '),
    state,
  });

  return `${getMicrosoftBaseUrl()}/authorize?${params.toString()}`;
}

async function postForm(url: string, body: URLSearchParams) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error_description || json.error || 'Calendar provider request failed');
  }

  return json;
}

async function fetchJson(url: string, accessToken: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  if (response.status === 204) {
    return null;
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error?.message || json.error_description || 'Provider API error');
  }

  return json;
}

function toBase64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function getCryptoKey() {
  const secret = requireEnv('CALENDAR_TOKEN_SECRET');
  const material = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return crypto.subtle.importKey('raw', material, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptSecret(value: string) {
  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(value),
  );

  return `${toBase64(iv)}.${toBase64(new Uint8Array(encrypted))}`;
}

export async function decryptSecret(value: string) {
  const [ivPart, payloadPart] = value.split('.');
  if (!ivPart || !payloadPart) {
    throw new Error('Invalid encrypted secret format');
  }

  const key = await getCryptoKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(ivPart) },
    key,
    fromBase64(payloadPart),
  );

  return new TextDecoder().decode(decrypted);
}

export async function exchangeCodeForTokens(provider: CalendarProvider, code: string) {
  ensureSupportedProvider(provider);
  return postForm(`${getMicrosoftBaseUrl()}/token`, new URLSearchParams({
    client_id: requireEnv('MICROSOFT_CLIENT_ID'),
    client_secret: requireEnv('MICROSOFT_CLIENT_SECRET'),
    grant_type: 'authorization_code',
    code,
    redirect_uri: getCalendarCallbackUrl(),
    scope: MICROSOFT_SCOPES.join(' '),
  }));
}

export async function refreshProviderTokens(provider: CalendarProvider, refreshToken: string) {
  ensureSupportedProvider(provider);
  return postForm(`${getMicrosoftBaseUrl()}/token`, new URLSearchParams({
    client_id: requireEnv('MICROSOFT_CLIENT_ID'),
    client_secret: requireEnv('MICROSOFT_CLIENT_SECRET'),
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    redirect_uri: getCalendarCallbackUrl(),
    scope: MICROSOFT_SCOPES.join(' '),
  }));
}

export async function fetchProviderProfile(provider: CalendarProvider, accessToken: string) {
  ensureSupportedProvider(provider);
  return fetchJson('https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName', accessToken);
}

export async function fetchProviderCalendars(provider: CalendarProvider, accessToken: string): Promise<ProviderCalendar[]> {
  ensureSupportedProvider(provider);
  const json = await fetchJson(
    'https://graph.microsoft.com/v1.0/me/calendars?$select=id,name,isDefaultCalendar,canEdit,hexColor',
    accessToken,
  );

  return (json.value || []).map((calendar: Record<string, unknown>) => ({
    id: String(calendar.id),
    name: String(calendar.name || 'Calendrier sans nom'),
    isDefault: Boolean(calendar.isDefaultCalendar),
    canEdit: calendar.canEdit === false ? false : true,
    color: typeof calendar.hexColor === 'string' ? calendar.hexColor : null,
  }));
}

function toGraphDateTime(value: string) {
  return new Date(value).toISOString().replace(/\.\d{3}Z$/, '');
}

function addHiddenMarker(description: string | null | undefined, timeEventId: string) {
  const safeDescription = description || '';
  return `${safeDescription}\n<!-- todoit:time_event_id=${timeEventId} -->`;
}

function buildRecurrence(eventRow: Record<string, unknown>) {
  const recurrence = eventRow.recurrence as Record<string, unknown> | null;
  if (!recurrence || typeof recurrence !== 'object') {
    return undefined;
  }

  const startDate = String(eventRow.starts_at).slice(0, 10);
  const interval = typeof recurrence.interval === 'number' ? recurrence.interval : 1;
  const daysOfWeek = Array.isArray(recurrence.daysOfWeek)
    ? recurrence.daysOfWeek.map((value) => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][Number(value)]).filter(Boolean)
    : undefined;

  switch (recurrence.frequency) {
    case 'daily':
      return {
        pattern: { type: 'daily', interval },
        range: { type: 'noEnd', startDate },
      };
    case 'weekly':
      return {
        pattern: { type: 'weekly', interval, daysOfWeek: daysOfWeek?.length ? daysOfWeek : ['monday'], firstDayOfWeek: 'monday' },
        range: { type: 'noEnd', startDate },
      };
    case 'bi-weekly':
      return {
        pattern: { type: 'weekly', interval: 2, daysOfWeek: daysOfWeek?.length ? daysOfWeek : ['monday'], firstDayOfWeek: 'monday' },
        range: { type: 'noEnd', startDate },
      };
    case 'monthly': {
      const explicitDay = typeof recurrence.dayOfMonth === 'number'
        ? recurrence.dayOfMonth
        : Array.isArray(recurrence.daysOfMonth) && recurrence.daysOfMonth.length > 0
          ? Number(recurrence.daysOfMonth[0])
          : Number(startDate.slice(8, 10));
      return {
        pattern: { type: 'absoluteMonthly', interval, dayOfMonth: explicitDay },
        range: { type: 'noEnd', startDate },
      };
    }
    default:
      return undefined;
  }
}

export async function hashPayload(payload: unknown) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)));
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, '0')).join('');
}

export function sanitizeConnection(connection: CalendarConnectionRow | null, available = true): SafeCalendarConnection {
  if (!connection) {
    return {
      provider: 'outlook',
      status: 'disconnected',
      connected: false,
      available,
      accountEmail: null,
      accountLabel: null,
      targetCalendarId: null,
      targetCalendarName: null,
      lastSyncedAt: null,
      lastSyncError: null,
      scopes: [],
    };
  }

  return {
    provider: connection.provider,
    status: connection.status,
    connected: connection.status === 'connected',
    available,
    accountEmail: connection.account_email,
    accountLabel: connection.account_label,
    targetCalendarId: connection.target_calendar_id,
    targetCalendarName: connection.target_calendar_name,
    lastSyncedAt: connection.last_synced_at,
    lastSyncError: connection.last_sync_error,
    scopes: connection.scopes || [],
  };
}

export async function getConnection(serviceClient: any, userId: string, provider: CalendarProvider): Promise<CalendarConnectionRow | null> {
  const { data, error } = await serviceClient
    .from('calendar_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to load calendar connection');
  }

  return data as CalendarConnectionRow | null;
}

export async function ensureProviderAccessToken(serviceClient: any, connection: CalendarConnectionRow) {
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0;
  const isStillValid = connection.access_token_ciphertext && expiresAt > Date.now() + (5 * 60 * 1000);

  if (isStillValid) {
    return decryptSecret(connection.access_token_ciphertext!);
  }

  if (!connection.refresh_token_ciphertext) {
    throw new Error('No refresh token available for this calendar connection');
  }

  const refreshToken = await decryptSecret(connection.refresh_token_ciphertext);
  const refreshed = await refreshProviderTokens(connection.provider, refreshToken);
  const accessTokenCiphertext = await encryptSecret(refreshed.access_token);
  const refreshTokenCiphertext = refreshed.refresh_token
    ? await encryptSecret(refreshed.refresh_token)
    : connection.refresh_token_ciphertext;
  const tokenExpiresAt = new Date(Date.now() + Number(refreshed.expires_in || 3600) * 1000).toISOString();

  const { error } = await serviceClient
    .from('calendar_connections')
    .update({
      access_token_ciphertext: accessTokenCiphertext,
      refresh_token_ciphertext: refreshTokenCiphertext,
      token_expires_at: tokenExpiresAt,
      scopes: refreshed.scope ? String(refreshed.scope).split(' ') : connection.scopes,
      status: 'connected',
      last_sync_error: null,
    })
    .eq('id', connection.id);

  if (error) {
    throw new Error(error.message || 'Failed to persist refreshed provider token');
  }

  return refreshed.access_token as string;
}

export function mapTimeEventToProviderEvent(eventRow: Record<string, unknown>) {
  const isAllDay = Boolean(eventRow.is_all_day);
  const startsAt = String(eventRow.starts_at);
  const endsAt = eventRow.ends_at ? String(eventRow.ends_at) : null;
  const timezone = typeof eventRow.timezone === 'string' && eventRow.timezone ? eventRow.timezone : 'UTC';

  if (isAllDay) {
    const startDate = startsAt.slice(0, 10);
    const endDate = endsAt
      ? endsAt.slice(0, 10)
      : new Date(new Date(startsAt).getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    return {
      subject: String(eventRow.title || 'Événement Todo-IT'),
      body: {
        contentType: 'html',
        content: addHiddenMarker(typeof eventRow.description === 'string' ? eventRow.description : '', String(eventRow.id)),
      },
      isAllDay: true,
      start: { dateTime: `${startDate}T00:00:00`, timeZone: timezone },
      end: { dateTime: `${endDate}T00:00:00`, timeZone: timezone },
      recurrence: buildRecurrence(eventRow),
    };
  }

  const endValue = endsAt || new Date(new Date(startsAt).getTime() + Number(eventRow.duration || 30) * 60 * 1000).toISOString();

  return {
    subject: String(eventRow.title || 'Événement Todo-IT'),
    body: {
      contentType: 'html',
      content: addHiddenMarker(typeof eventRow.description === 'string' ? eventRow.description : '', String(eventRow.id)),
    },
    start: { dateTime: toGraphDateTime(startsAt), timeZone: timezone },
    end: { dateTime: toGraphDateTime(endValue), timeZone: timezone },
    recurrence: buildRecurrence(eventRow),
  };
}

export async function createProviderEvent(provider: CalendarProvider, accessToken: string, calendarId: string, payload: Record<string, unknown>) {
  ensureSupportedProvider(provider);
  return fetchJson(`https://graph.microsoft.com/v1.0/me/calendars/${encodeURIComponent(calendarId)}/events`, accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProviderEvent(provider: CalendarProvider, accessToken: string, calendarId: string, eventId: string, payload: Record<string, unknown>) {
  ensureSupportedProvider(provider);
  return fetchJson(`https://graph.microsoft.com/v1.0/me/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteProviderEvent(provider: CalendarProvider, accessToken: string, calendarId: string, eventId: string) {
  ensureSupportedProvider(provider);
  const response = await fetch(`https://graph.microsoft.com/v1.0/me/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404 || response.status === 204) {
    return true;
  }

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.error?.message || 'Provider delete failed');
  }

  return true;
}

export async function queueFullResyncForUser(serviceClient: any, userId: string, provider: CalendarProvider) {
  const connection = await getConnection(serviceClient, userId, provider);
  if (!connection) {
    return { connection: null, queued: 0 };
  }

  const { data: events, error: eventsError } = await serviceClient
    .from('time_events')
    .select('*')
    .eq('user_id', userId)
    .in('entity_type', ['task', 'habit', 'challenge'])
    .neq('status', 'cancelled');

  if (eventsError) {
    throw new Error(eventsError.message || 'Impossible de lire les événements à synchroniser');
  }

  const { data: links, error: linksError } = await serviceClient
    .from('calendar_event_links')
    .select('*')
    .eq('connection_id', connection.id)
    .is('deleted_at', null);

  if (linksError) {
    throw new Error(linksError.message || 'Impossible de lire les liens agenda');
  }

  const currentEventIds = new Set((events || []).map((event: { id: string }) => event.id));
  const jobsToInsert = [
    ...(events || []).map((event: Record<string, unknown>) => ({
      user_id: userId,
      provider,
      time_event_id: event.id,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      action: 'upsert',
      event_payload: event,
    })),
    ...(links || [])
      .filter((link: { time_event_id: string }) => !currentEventIds.has(link.time_event_id))
      .map((link: { time_event_id: string }) => ({
        user_id: userId,
        provider,
        time_event_id: link.time_event_id,
        entity_type: 'task',
        entity_id: link.time_event_id,
        action: 'delete',
        event_payload: { id: link.time_event_id },
      })),
  ];

  if (jobsToInsert.length > 0) {
    const { error: insertError } = await serviceClient.from('calendar_sync_jobs').insert(jobsToInsert);
    if (insertError) {
      throw new Error(insertError.message || 'Impossible de recréer la file de synchronisation');
    }
  }

  return { connection, queued: jobsToInsert.length };
}

export async function processCalendarJobsForUser(serviceClient: any, userId: string, provider: CalendarProvider, limit = 20) {
  const connection = await getConnection(serviceClient, userId, provider);
  if (!connection || connection.status !== 'connected' || !connection.target_calendar_id) {
    return { connected: false, processed: 0, succeeded: 0, failed: 0 };
  }

  const accessToken = await ensureProviderAccessToken(serviceClient, connection);
  const { data: jobs, error } = await serviceClient
    .from('calendar_sync_jobs')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .in('status', ['pending', 'error'])
    .lte('available_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message || 'Failed to load calendar sync jobs');
  }

  let succeeded = 0;
  let failed = 0;

  for (const job of jobs || []) {
    await serviceClient
      .from('calendar_sync_jobs')
      .update({ status: 'processing' })
      .eq('id', job.id);

    try {
      const { data: link } = await serviceClient
        .from('calendar_event_links')
        .select('*')
        .eq('connection_id', connection.id)
        .eq('time_event_id', job.time_event_id)
        .maybeSingle();

      if (job.action === 'delete') {
        if (link?.external_event_id) {
          await deleteProviderEvent(provider, accessToken, link.external_calendar_id, link.external_event_id);
          await serviceClient
            .from('calendar_event_links')
            .update({ deleted_at: new Date().toISOString(), last_synced_at: new Date().toISOString() })
            .eq('id', link.id);
        }
      } else {
        const { data: eventRow } = await serviceClient
          .from('time_events')
          .select('*')
          .eq('id', job.time_event_id)
          .maybeSingle();

        if (!eventRow || eventRow.status === 'cancelled') {
          if (link?.external_event_id) {
            await deleteProviderEvent(provider, accessToken, link.external_calendar_id, link.external_event_id);
            await serviceClient
              .from('calendar_event_links')
              .update({ deleted_at: new Date().toISOString(), last_synced_at: new Date().toISOString() })
              .eq('id', link.id);
          }
        } else {
          const payload = mapTimeEventToProviderEvent(eventRow as Record<string, unknown>);
          const payloadHash = await hashPayload(payload);
          let externalEvent: Record<string, unknown> | null = null;

          if (link?.external_event_id && !link.deleted_at && link.external_calendar_id === connection.target_calendar_id && link.last_payload_hash === payloadHash) {
            externalEvent = { id: link.external_event_id, changeKey: link.external_change_key };
          } else if (link?.external_event_id && !link.deleted_at && link.external_calendar_id === connection.target_calendar_id) {
            try {
              externalEvent = await updateProviderEvent(provider, accessToken, link.external_calendar_id, link.external_event_id, payload);
            } catch (error) {
              externalEvent = await createProviderEvent(provider, accessToken, connection.target_calendar_id, payload);
            }
          } else {
            if (link?.external_event_id && link.external_calendar_id !== connection.target_calendar_id) {
              await deleteProviderEvent(provider, accessToken, link.external_calendar_id, link.external_event_id).catch(() => true);
            }
            externalEvent = await createProviderEvent(provider, accessToken, connection.target_calendar_id, payload);
          }

          await serviceClient
            .from('calendar_event_links')
            .upsert({
              id: link?.id,
              connection_id: connection.id,
              user_id: userId,
              provider,
              time_event_id: job.time_event_id,
              external_calendar_id: connection.target_calendar_id,
              external_event_id: String(externalEvent?.id || link?.external_event_id),
              external_change_key: typeof externalEvent?.changeKey === 'string' ? externalEvent.changeKey : link?.external_change_key,
              last_payload_hash: payloadHash,
              metadata: { calendarName: connection.target_calendar_name },
              last_synced_at: new Date().toISOString(),
              deleted_at: null,
            }, { onConflict: 'connection_id,time_event_id' });
        }
      }

      await serviceClient
        .from('calendar_sync_jobs')
        .update({ status: 'done', processed_at: new Date().toISOString(), last_error: null })
        .eq('id', job.id);
      succeeded += 1;
    } catch (error) {
      const attemptCount = Number(job.attempt_count || 0) + 1;
      const nextRetryAt = new Date(Date.now() + Math.min(60, attemptCount * 5) * 60 * 1000).toISOString();
      await serviceClient
        .from('calendar_sync_jobs')
        .update({
          status: 'error',
          attempt_count: attemptCount,
          last_error: error instanceof Error ? error.message : String(error),
          available_at: nextRetryAt,
        })
        .eq('id', job.id);
      failed += 1;
    }
  }

  await serviceClient
    .from('calendar_connections')
    .update({
      last_synced_at: new Date().toISOString(),
      last_sync_error: failed > 0 ? `${failed} job(s) en erreur` : null,
      status: failed > 0 ? 'error' : 'connected',
    })
    .eq('id', connection.id);

  return {
    connected: true,
    processed: (jobs || []).length,
    succeeded,
    failed,
  };
}




