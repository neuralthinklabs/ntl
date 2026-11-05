# Google sign-in + Series/Magazines

## 1. Run the migrations (Supabase SQL editor, in this order)
1. supabase/migrations/0017_google_profiles.sql
2. supabase/migrations/0018_collections.sql

## 2. Set up Google sign-in (free)
1. console.cloud.google.com -> create a project (no billing needed).
2. Google Auth Platform -> Branding/Get started: app name, support email,
   Audience = External, contact email.
3. Clients -> Create client -> Web application.
   Authorized redirect URI (copy it from Supabase > Authentication > Providers > Google):
   https://YOUR_PROJECT.supabase.co/auth/v1/callback
4. Copy the Client ID and Client secret.
5. Supabase > Authentication > Providers > Google: enable, paste both, save.
6. Supabase > Authentication > URL Configuration:
   Site URL = your real https URL.
   Redirect URLs = https://YOURDOMAIN/auth/callback and http://localhost:3000/auth/callback
7. Google Auth Platform > Audience: click "Publish app" so anyone can sign in
   (basic email/profile scopes need no Google review).

## 3. Use Series/Magazines
Admin > Series & magazines > New. Save, add stories on the next screen, tick Published.
Public pages: /series and /magazines.
