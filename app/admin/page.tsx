import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from '@/components/AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')
  if (user.id !== process.env.ADMIN_USER_ID) redirect('/')

  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('*')
    .order('kickoff_at', { ascending: true })

  return <AdminClient fixtures={fixtures || []} />
}