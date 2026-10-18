# NTL fixes patch: how to apply
1. Unzip over the repo (overwrites app/u/[ntlId]/page.tsx, adds migration 0010 and apply-fixes.sh).
2. `./apply-fixes.sh`  (title suffixes, delete design-system, CTA centering, .gitignore)
3. Supabase SQL editor: run supabase/migrations/0010_privacy_fixes.sql
   (drafts no longer readable with the anon key; hidden credits no longer linkable).
4. Supabase dashboard > Authentication > URL Configuration: set Site URL to your live domain
   and add `https://YOUR_DOMAIN/**` to Redirect URLs (fixes the localhost:3030 verification link).
5. `pnpm typecheck && pnpm test && pnpm build`

Not in this patch (needs a small design decision): keeping typed values after a failed
login/contact submit, and resetting the Turnstile widget after an error.
