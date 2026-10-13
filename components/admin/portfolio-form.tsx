'use client'

import { useActionState } from 'react'
import { savePortfolioItem } from '@/actions/admin/portfolio'
import { PORTFOLIO_STATUSES, PORTFOLIO_TYPES } from '@/lib/portfolio'
import { Field, FormMessage, SubmitButton, fieldClass } from './fields'

export type PortfolioFormValues = {
  id?: string
  name: string
  type: string
  status: string
  description: string
  sortOrder: string
}

export function PortfolioForm({ initial }: { initial?: PortfolioFormValues }) {
  const [state, action] = useActionState(savePortfolioItem, null)
  const v = initial
  return (
    <form action={action} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {v?.id && <input type="hidden" name="id" value={v.id} />}
      <Field label="Name">
        <input name="name" required defaultValue={v?.name} className={fieldClass} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Type">
          <select name="type" defaultValue={v?.type ?? 'Product'} className={fieldClass}>
            {PORTFOLIO_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={v?.status ?? 'Planned'} className={fieldClass}>
            {PORTFOLIO_STATUSES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Order" hint="Lower numbers appear first.">
          <input name="sortOrder" type="number" min="0" defaultValue={v?.sortOrder ?? '0'} className={fieldClass} />
        </Field>
      </div>
      <Field label="Description">
        <textarea name="description" rows={3} required defaultValue={v?.description} className={`${fieldClass} resize-none`} />
      </Field>
      <FormMessage state={state} />
      <div>
        <SubmitButton>{v?.id ? 'Save item' : 'Add item'}</SubmitButton>
      </div>
    </form>
  )
}
