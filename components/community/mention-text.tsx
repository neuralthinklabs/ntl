import Link from 'next/link'

const SPLIT = /(@NTL-[A-Z0-9]{4}-[A-Z0-9]{4})/gi
const IS_MENTION = /^@NTL-[A-Z0-9]{4}-[A-Z0-9]{4}$/i

/** Plain text with @NTL-XXXX-XXXX turned into links to the member's page. Everything else stays escaped text. */
export function MentionText({ text }: { text: string }) {
  return (
    <>
      {text.split(SPLIT).map((part, i) =>
        IS_MENTION.test(part) ? (
          <Link key={i} href={`/community/members/${part.slice(1).toUpperCase()}`} className="font-medium text-brand-muted hover:underline">
            {part}
          </Link>
        ) : (
          part
        ),
      )}
    </>
  )
}
