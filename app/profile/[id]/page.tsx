import { createClient } from '@/lib/supabase/server'
import ProfileClient from '@/components/ProfileClient'
import { redirect } from 'next/navigation'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
    
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*, fixtures(*)')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', id)

  const totalPoints = scores?.reduce((sum, s) => sum + s.total_pts, 0) || 0
  const exactScores = scores?.filter(s => s.exact_score_pts > 0).length || 0
  const correctResults = scores?.filter(s => s.result_pts > 0).length || 0

  return (
    <ProfileClient
      profile={profile}
      predictions={predictions || []}
      totalPoints={totalPoints}
      exactScores={exactScores}
      correctResults={correctResults}
      isOwnProfile={user.id === id}
    />
  )
}