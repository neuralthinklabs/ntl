import { AdminHeader } from '@/components/admin/admin-header'
import { PostForm } from '@/components/admin/post-form'

export const metadata = { title: 'New post' }

export default function NewPostPage() {
  return (
    <>
      <AdminHeader title="New post" />
      <PostForm />
    </>
  )
}
