# NTL ID provider patch: "Sign in with NTL ID" for other websites

## What this adds
- `/oauth/consent`: the approve/deny screen partner sites send people to
- `/account/connected-apps`: people see and remove the apps they allowed
- `/admin/oauth-clients`: admins register partner sites (client ID + secret)
- `/developers`: public integration guide
- `/api/ntl/userinfo`: gives partners the NTL ID and public name (respects "show credit")
- Signup now keeps `next`, so a new person arriving from a partner site lands back on the consent screen

## Apply
1. Unzip over the repo root (overwrites `app/auth/signup/page.tsx`, adds the new files).
2. `python3 apply-ntl-id.py` (patches 9 existing files; re-runnable).
3. Add `SUPABASE_SERVICE_ROLE_KEY` to your env (Vercel/Netlify and `.env.local`). Server only, never `NEXT_PUBLIC_`.
4. `pnpm typecheck && pnpm test && pnpm build`.

## Supabase setup (dashboard)
1. Authentication > OAuth Server: enable it.
2. Set the authorization path to `/oauth/consent` (your site URL + that path).
3. Use asymmetric JWT signing keys (required for OpenID Connect ID tokens).
4. Make sure Site URL and redirect URLs in Auth settings point at the live site.
Local dev: the same settings go in `supabase/config.toml` under the auth OAuth server section.

## Test it end to end
1. In `/admin/oauth-clients` register a test app with redirect URL `http://localhost:3000/cb`. Copy the client ID.
2. Open: `<SUPABASE_URL>/auth/v1/oauth/authorize?client_id=<ID>&response_type=code&redirect_uri=http://localhost:3000/cb&scope=openid%20profile%20email&code_challenge=<S256 challenge>&code_challenge_method=S256&state=x`
3. You should land on `/oauth/consent`, approve, and be sent to your redirect URL with `?code=`.
4. Exchange the code at the token endpoint listed in the discovery document, then call `/api/ntl/userinfo` with the access token.

## Things I could not verify offline. Check these first
- **Method names and response shapes.** They follow the supabase-js docs (`getAuthorizationDetails`, `approveAuthorization`, `denyAuthorization`, `listGrants`, `revokeGrant`, `auth.admin.oauth.*`). The OAuth server is in public beta, so field names (`redirect_url`, `client.name`, `client_secret`) may differ slightly. All access goes through `lib/oauth.ts`, so any fix is in one file. Upgrade `@supabase/supabase-js` if a method is missing.
- **Scope claim in access tokens.** `/api/ntl/userinfo` reads a `scope` claim. If your tokens have none, it returns `sub` and the NTL ID/name but never the email. Decode a real token once to confirm.
- **Custom domains.** A custom Supabase domain has had issuer mismatch reports in discovery. Test before using `id.neuralthinklabs.org`.

## Security notes
- Redirect URLs are validated (https only, no fragments, localhost allowed for dev) when registering and again before any redirect.
- The service-role key is used only by `lib/supabase/admin.ts` (`server-only`), and only on admin pages/actions.
- The client secret is shown once and never stored or logged by NTL. Audit log records create/delete without it.
- The consent page is not frameable (your existing `X-Frame-Options: SAMEORIGIN`).
- `/api/ntl/userinfo` has no rate limit yet. Add `checkRateLimit` if partners call it heavily.

## Not in this patch (recommended next)
MFA (TOTP), a "sessions and devices" page, account deletion/export, and a "not you? switch account" link on the consent screen.
