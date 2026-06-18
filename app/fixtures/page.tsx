import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FixturesClient from '@/components/FixturesClient'

export default async function FixturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('*')
    .order('kickoff_at', { ascending: true })

  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user.id)

  return (
    <FixturesClient
      fixtures={fixtures || []}
      predictions={predictions || []}
      userId={user.id}
    />
  )
}