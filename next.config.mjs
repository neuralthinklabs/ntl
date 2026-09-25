/** @type {import('next').NextConfig} */
const nextConfig = {
  // P1 #7: removed `typescript.ignoreBuildErrors` — the build must fail on
  // real type errors instead of silently shipping them. If you have a
  // handful of pre-existing type errors, fix them (or narrow-suppress with
  // `// @ts-expect-error` at the specific line) rather than reinstating this.
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      // actions/problems.ts allows up to MAX_FILES (5) attachments of
      // MAX_FILE_SIZE (10MB) each = 50MB of raw file data, plus
      // multipart/base64 overhead and the rest of the form fields.
      // Next's default Server Action body limit is 1MB, which silently
      // rejects any submission with attachments without this override.
      // Keep this in sync with actions/problems.ts if those constants
      // change.
      bodySizeLimit: '60mb',
    },
  },
}

export default nextConfig
