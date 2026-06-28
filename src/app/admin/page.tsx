import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { NavBar } from '@/components/ui/NavBar'
import { AdminClient } from '@/components/sections/AdminClient'

export const metadata = { title: 'Admin — All Projects' }

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'dev') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar role={session.user.role} userName={session.user.name ?? undefined} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Admin Panel</h1>
          <p className="text-text-secondary text-sm mt-1">
            Create and manage projects, log activities, and manage blockers
          </p>
        </div>
        <AdminClient />
      </div>
    </div>
  )
}
