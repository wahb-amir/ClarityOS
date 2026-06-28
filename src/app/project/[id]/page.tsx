import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { NavBar } from '@/components/ui/NavBar'
import { ProjectClient } from '@/components/sections/ProjectClient'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params

  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar role={session.user.role} userName={session.user.name ?? undefined} />
      <ProjectClient projectId={id} />
    </div>
  )
}
