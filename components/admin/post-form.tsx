'use client'

import { useActionState } from 'react'
import { savePost } from '@/actions/admin/posts'
import { goals } from '@/lib/ntldgs'
import { STORY_CATEGORIES } from '@/lib/stories'
import { Field, FormMessage, SubmitButton, fieldClass } from './fields'
import { ImageUpload } from './image-upload'

export type PostFormValues = {
  id?: string
  title: string
  slug: string
  category: string
  excerpt: string
  body: string
  coverImage: string
  ntldgSlug: string
  published: boolean
}

export function PostForm({ initial }: { initial?: PostFormValues }) {
  const [state, action] = useActionState(savePost, null)
  const v = initial

  return (
    <form action={action} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {v?.id && <input type="hidden" name="id" value={v.id} />}
      <Field label="Title">
        <input name="title" required defaultValue={v?.title} className={fieldClass} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" hint="Choose “Blog” for blog posts.">
          <select name="category" defaultValue={v?.category ?? 'Blog'} className={fieldClass}>
            {STORY_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Related goal (optional)" hint="Shows this post on that goal's page.">
          <select name="ntldgSlug" defaultValue={v?.ntldgSlug ?? ''} className={fieldClass}>
            <option value="">None</option>
            {goals.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.number}. {g.verb}: {g.title}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Short summary" hint="Shown on cards and in link previews. Up to 400 characters.">
        <textarea name="excerpt" rows={2} maxLength={400} defaultValue={v?.excerpt} className={`${fieldClass} resize-none`} />
      </Field>
      <Field
        label="Body"
        hint="Blank line = new paragraph. Start a line with “## ” for a heading or “- ” for a bullet. **bold** and [text](https://link) work."
      >
        <textarea name="body" rows={16} defaultValue={v?.body} className={`${fieldClass} font-mono`} />
      </Field>
      <ImageUpload name="coverImage" folder="posts" defaultValue={v?.coverImage} label="Cover image" />
      <Field label="Web address (optional)" hint="Leave blank to build it from the title. Letters, numbers and dashes only.">
        <input name="slug" defaultValue={v?.slug} className={fieldClass} />
      </Field>

      <FormMessage state={state} />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton name="intent" value="publish" pendingLabel="Publishing…">
          {v?.published ? 'Save and keep published' : 'Publish'}
        </SubmitButton>
        <SubmitButton name="intent" value="draft" variant="outline">
          {v?.published ? 'Unpublish (save as draft)' : 'Save draft'}
        </SubmitButton>
      </div>
    </form>
  )
}
