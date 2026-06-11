import { createClient } from '@/lib/supabase/server'
import RulesClient from '@/components/RulesClient'

export default async function RulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return <RulesClient profile={profile} />
}
