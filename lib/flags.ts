// Shared country → flag-emoji map used across the app.
export const FLAGS: Record<string, string> = {
  'Mexico': '🇲🇽', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷',
  'Czechia': '🇨🇿', 'Canada': '🇨🇦', 'Bosnia-Herzegovina': '🇧🇦',
  'United States': '🇺🇸', 'Paraguay': '🇵🇾', 'Qatar': '🇶🇦',
  'Switzerland': '🇨🇭', 'Brazil': '🇧🇷', 'Morocco': '🇲🇦',
  'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Australia': '🇦🇺',
  'Turkey': '🇹🇷', 'Germany': '🇩🇪', 'Curaçao': '🇨🇼',
  'Spain': '🇪🇸', 'Finland': '🇫🇮', 'Argentina': '🇦🇷',
  'Nigeria': '🇳🇬', 'Japan': '🇯🇵', 'Belgium': '🇧🇪',
  'Portugal': '🇵🇹', 'Iran': '🇮🇷', 'France': '🇫🇷',
  'Saudi Arabia': '🇸🇦', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Senegal': '🇸🇳',
  'Netherlands': '🇳🇱', 'Ecuador': '🇪🇨', 'Uruguay': '🇺🇾',
  'Colombia': '🇨🇴', 'Chile': '🇨🇱', 'Italy': '🇮🇹',
  'Croatia': '🇭🇷', 'Poland': '🇵🇱', 'Denmark': '🇩🇰',
  'Serbia': '🇷🇸', 'Hungary': '🇭🇺', 'Egypt': '🇪🇬',
  'Ghana': '🇬🇭', 'Cameroon': '🇨🇲', 'Tunisia': '🇹🇳',
  'Algeria': '🇩🇿', 'Mali': '🇲🇱', 'Venezuela': '🇻🇪',
  'Peru': '🇵🇪', 'Bolivia': '🇧🇴', 'Honduras': '🇭🇳',
  'Costa Rica': '🇨🇷', 'Panama': '🇵🇦', 'Jamaica': '🇯🇲',
  'Trinidad and Tobago': '🇹🇹', 'New Zealand': '🇳🇿',
  'Indonesia': '🇮🇩', 'Iraq': '🇮🇶', 'Jordan': '🇯🇴',
  'Uzbekistan': '🇺🇿', 'Ukraine': '🇺🇦', 'Austria': '🇦🇹',
  'Slovakia': '🇸🇰', 'Greece': '🇬🇷', 'Romania': '🇷🇴',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Norway': '🇳🇴', 'Sweden': '🇸🇪',
  'Russia': '🇷🇺', 'China': '🇨🇳', 'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳', 'Kazakhstan': '🇰🇿', 'Azerbaijan': '🇦🇿',
  'Ivory Coast': '🇨🇮', 'Cape Verde': '🇨🇻'
}

export function getFlag(team: string | null | undefined) {
  if (!team) return '🏳️'
  return FLAGS[team] || '🏳️'
}
