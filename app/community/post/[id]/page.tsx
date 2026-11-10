import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { PostCard } from '@/components/community/post-card'
import { CommentForm, ReplyToggle } from '@/components/community/comment-form'
import { ActionButton } from '@/components/community/action-button'
import { loadGroup } from '@/lib/community/authz'
import { getComments, getPollData, getPost } from '@/lib/community/queries'
import { removeComment } from '@/actions/community-manage'
import { reportComment } from '@/actions/community'
import { deleteOwnComment } from '@/actions/community-edit'
import { groupHref } from '@/lib/community/constants'
import { formatDate } from '@/lib/datetime'
import { getViewer } from '@/lib/community/authz'

type Props = { params: Promise<{ id: string }> }
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Community post', robots: { index: false, follow: true } }

export default async function PostPage({ params }: Props) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const viewer = await getViewer()
  const post = await getPost(id, viewer?.id ?? null)
  if (!post) notFound()

  // The group decides who may read: internal and private posts 404 for outsiders.
  const ctx = await loadGroup(post.communitySlug, post.communityVisibility === 'internal')
  if (!ctx || !ctx.access.canView) notFound()
  const { access } = ctx
  const mine = !!viewer && post.authorId === viewer.id
  if (post.status !== 'published' && !access.canModerate && !mine) notFound()

  const [comments, polls] = await Promise.all([
    post.status === 'published' ? getComments(post.id, viewer?.id ?? null) : Promise.resolve([]),
    getPollData(post.type === 'poll' ? [post.id] : [], viewer?.id ?? null),
  ])
  const byId = new Map(comments.map((c) => [c.id, c]))
  const rootOf = (c: (typeof comments)[number]) => { let cur = c; for (let i = 0; i < 20 && cur.parentId && byId.get(cur.parentId); i++) cur = byId.get(cur.parentId)!; return cur.id }
  const roots = comments.filter((c) => !c.parentId || !byId.has(c.parentId))
  const replies = (rootId: string) => comments.filter((c) => c.parentId && rootOf(c) === rootId && c.id !== rootId)
  const loggedIn = !!viewer && !viewer.blocked

  const row = (c: (typeof comments)[number], reply = false) => (
    <li key={c.id} className={reply ? 'ml-6 border-l-2 border-slate-200 pl-4' : ''}>
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <p className="text-xs text-slate-600">
          {c.authorNtlId ? <Link href={`/community/members/${c.authorNtlId}`} className="font-medium text-ink hover:underline">{c.authorName}</Link> : c.authorName} · {formatDate(c.createdAt)}
        </p>
        <p className="mt-1.5 whitespace-pre-wrap text-slate-800">{c.body}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {access.canInteract && !reply && <ReplyToggle postId={post.id} parentId={c.id} />}
          {viewer && c.authorId !== viewer.id && <ActionButton action={reportComment.bind(null, c.id)} label="Report" promptLabel="What is wrong with this comment?" variant="link" />}
          {viewer && c.authorId === viewer.id && <ActionButton action={deleteOwnComment.bind(null, c.id)} label="Delete" confirm="Delete your comment?" variant="link" className="!text-red-700" />}
          {access.canModerate && <ActionButton action={removeComment.bind(null, c.id)} label="Remove" promptLabel="Why is this being removed? The author will see this." variant="link" className="!text-red-700" />}
        </div>
      </div>
    </li>
  )

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link href={groupHref({ slug: post.communitySlug, visibility: post.communityVisibility })} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:underline">
          <ArrowLeft className="size-4" /> {post.communityName}
        </Link>
        <div className="mt-5">
          <PostCard post={post} poll={polls[post.id]} loggedIn={loggedIn} viewerId={viewer?.id ?? null} canModerate={access.canModerate} detail />
        </div>
        {post.status === 'published' && (
          <section className="mt-8" aria-labelledby="comments-heading">
            <h2 id="comments-heading" className="text-base font-semibold text-ink">Comments ({comments.length})</h2>
            <div className="mt-4">
              {access.canInteract ? <CommentForm postId={post.id} /> : (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-700">
                  {viewer ? (access.restricted ? 'You cannot comment here right now.' : 'Join this group to comment.') : <><Link href={`/auth/login?next=${encodeURIComponent(`/community/post/${post.id}`)}`} className="font-semibold text-brand-muted underline">Log in</Link> to comment.</>}
                </p>
              )}
            </div>
            <ul className="mt-5 flex flex-col gap-3">
              {comments.length === 0 && <li className="text-sm text-slate-600">No comments yet.</li>}
              {roots.map((c) => (
                <li key={c.id}>
                  <ul className="flex flex-col gap-2">{row(c)}{replies(c.id).map((r) => row(r, true))}</ul>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </SiteShell>
  )
}
