# NTL brand patch 2: remaining pages, layouts, components

Apply AFTER patch 1.
1. Unzip over the repo root. Overwrites: components/site/ui.tsx (blue-square eyebrow labels, rule under
   headings, geometric icon tiles, navy-to-blue progress bars), app/not-found.tsx, app/error.tsx
   (dark branded panels with the new graphics).
2. `python3 apply-brand-2.py` then `pnpm typecheck && pnpm build`.

What the script covers: sign-in/sign-up/reset pages (branded card, app icon, dot grid), dashboard banner,
admin portal label, legal pages, portfolio cards, greyscale photography on Support/campaign heroes,
12 Goals hero (orbit recoloured to the brand blues, dot grid + glow), root error page colours.

Already handled by tokens from patch 1 (no edits needed): navbar, buttons, forms, events, stories,
Atlas pages, volunteer, FAQ, admin tables, problem form, team workspace.
