'use client'

// Last-resort boundary for errors in the root layout itself.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'grid', minHeight: '100vh', placeItems: 'center', margin: 0 }}>
        <div style={{ textAlign: 'center', maxWidth: 380, padding: 16 }}>
          <h1 style={{ fontSize: 24 }}>Something went wrong</h1>
          <p style={{ color: '#475569' }}>Please try again. If it keeps happening, email us at hello@neuralthinklabs.org.</p>
          <button onClick={() => reset()} style={{ padding: '10px 20px', borderRadius: 8, border: 0, background: '#12b886', color: '#04140f', fontWeight: 600 }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
