import Link from 'next/link'
import { BadgeCheck, CalendarDays, ExternalLink, MapPin, Pin } from 'lucide-react'
import { ReactionBar, Poll } from './post-actions'
import { ActionButton } from './action-button'
import { PostAttachments } from './post-attachments'
import { PostAuthorTools } from './post-author-tools'
import { removePost, restorePost, setPinned, approvePost } from '@/actions/community-manage'
import { POST_TYPE_LABEL, groupHref } from '@/lib/community/constants'
import { formatDate } from '@/lib/datetime'
import { formatInZone } from '@/lib/datetime'
import type { FeedPost, PollView } from '@/lib/community/queries'
import { cn } from '@/lib/utils'

const TYPE_TONE: Record<string, string> = {
  announcement: 'bg-ink text-white',
  idea: 'bg-amber-100 text-amber-800',
  poll: 'bg-violet-100 text-violet-800',
  research: 'bg-emerald-100 text-emerald-800',
  event: 'bg-sky-100 text-sky-800',
  project_update: 'bg-brand/10 text-brand-muted',
  resource: 'bg-slate-200 text-slate-800',
  discussion: 'bg-slate-100 text-slate-700',
}

export function PostCard({
  post,
  poll,
  loggedIn,
  viewerId,
  canModerate = false,
  detail = false,
  showGroup = true,
}: {
  post: FeedPost
  poll?: PollView
  loggedIn: boolean
  viewerId: string | null
  canModerate?: boolean
  detail?: boolean
  showGroup?: boolean
}) {
  const href = `/community/post/${post.id}`
  const closed = !!post.pollClosesAt && post.pollClosesAt < new Date()
  return (
    <article className={cn('rounded-2xl border bg-white p-5 shadow-sm', post.status === 'pending' ? 'border-amber-300' : post.status === 'removed' ? 'border-red-200 opacity-80' : 'border-slate-200')}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={cn('rounded-full px-2.5 py-0.5 font-medium', TYPE_TONE[post.type] ?? TYPE_TONE.discussion)}>{POST_TYPE_LABEL[post.type] ?? post.type}</span>
        {post.pinned && <span className="inline-flex items-center gap-1 text-slate-600"><Pin className="size-3" /> Pinned</span>}
        {post.status === 'pending' && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-800">Awaiting approval</span>}
        {post.status === 'removed' && <span className="rounded-full bg-red-100 px-2.5 py-0.5 font-medium text-red-700">Removed</span>}
        {showGroup && (
          <Link href={groupHref({ slug: post.communitySlug, visibility: post.communityVisibility })} className="font-medium text-brand-muted hover:underline">{post.communityName}</Link>
        )}
        <span className="ml-auto text-slate-600">{formatDate(post.createdAt)}{post.editedAt ? ' · edited' : ''}</span>
      </div>

      {post.title && (
        <h3 className="mt-3 text-base font-semibold text-ink">
          {detail ? post.title : <Link href={href} className="hover:underline">{post.title}</Link>}
        </h3>
      )}
      <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
        {post.authorNtlId ? (
          <Link href={`/community/members/${post.authorNtlId}`} className="font-medium text-ink hover:underline">{post.authorName}</Link>
        ) : (
          <span>{post.authorName}</span>
        )}
        {post.authorVerified && (
          <span className="inline-flex items-center gap-0.5 text-brand-muted" title="Verified contributor"><BadgeCheck className="size-3.5" /><span className="sr-only">Verified contributor</span></span>
        )}
      </p>

      <p className={cn('mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700', !detail && 'line-clamp-6')}>{post.body}</p>

      {post.attachments > 0 && post.status !== 'removed' && <PostAttachments postId={post.id} />}

      {post.type === 'event' && post.eventStartsAt && (
        <ul className="mt-3 flex flex-col gap-1 text-sm text-slate-700">
          <li className="flex items-center gap-2"><CalendarDays className="size-4 text-slate-500" />{formatInZone(post.eventStartsAt, 'UTC', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}</li>
          {post.eventLocation && <li className="flex items-center gap-2"><MapPin className="size-4 text-slate-500" />{post.eventLocation}</li>}
        </ul>
      )}
      {post.linkUrl && post.linkUrl.startsWith('https://') && (
        <p className="mt-3">
          <a href={post.linkUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 break-all text-sm font-medium text-brand-muted underline">
            <ExternalLink className="size-4 shrink-0" /> {post.linkUrl.replace(/^https:\/\//, '').slice(0, 70)}
          </a>
        </p>
      )}
      {post.type === 'poll' && poll && <Poll postId={post.id} poll={poll} closed={closed} canInteract={loggedIn} />}

      {post.status === 'published' && (
        <ReactionBar
          postId={post.id}
          reactions={post.reactions}
          comments={post.comments}
          mine={post.myReaction}
          canInteract={loggedIn}
          loggedIn={loggedIn}
          detailHref={detail ? undefined : href}
          authorId={post.authorId}
          viewerId={viewerId}
        />
      )}

      {viewerId && post.authorId === viewerId && post.status !== 'removed' && (
        <PostAuthorTools postId={post.id} type={post.type} title={post.title} body={post.body} linkUrl={post.linkUrl} />
      )}

      {canModerate && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Moderate</span>
          {post.status === 'pending' && <ActionButton action={approvePost.bind(null, post.id)} label="Approve" variant="primary" />}
          {post.status === 'published' && (
            <>
              <ActionButton action={setPinned.bind(null, post.id, !post.pinned)} label={post.pinned ? 'Unpin' : 'Pin'} />
              <ActionButton action={removePost.bind(null, post.id)} label="Remove" promptLabel="Why is this being removed? The author will see this." variant="danger" />
            </>
          )}
          {post.status === 'pending' && <ActionButton action={removePost.bind(null, post.id)} label="Reject" promptLabel="Why is this being rejected? The author will see this." variant="danger" />}
          {post.status === 'removed' && <ActionButton action={restorePost.bind(null, post.id)} label="Restore" />}
        </div>
      )}
    </article>
  )
}
