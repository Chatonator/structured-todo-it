# External Calendar Sync

This folder contains the frontend bridge for external calendar sync.

## Scope

- V1 is `app -> Outlook` only.
- Google is prepared in the backend contracts but not enabled yet.
- The source of truth is `time_events`.
- Only `task`, `habit`, and `challenge` events are exported.
- Internal `recovery` and `external` events are not exported.

## Security model

- OAuth secrets and refresh tokens must stay in Supabase Edge Functions / database.
- The frontend only talks to Edge Functions.
- No calendar credentials are stored in `localStorage`.

## Required Supabase secrets

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL`
- `CALENDAR_TOKEN_SECRET`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_TENANT_ID` (optional, defaults to `common`)

## Microsoft app prerequisites

Use a Microsoft Entra application configured for:

- personal Microsoft accounts
- work or school accounts

Minimum delegated scopes:

- `Calendars.ReadWrite`
- `User.Read`
- `openid`
- `profile`
- `offline_access`

Redirect URI:

- `${SUPABASE_URL}/functions/v1/calendar-connect-callback`

## Frontend integration rule

Any feature that creates, updates, or deletes a `time_event` should trigger
`requestCalendarSyncProcessing()` from a central persistence layer, not from a view.
