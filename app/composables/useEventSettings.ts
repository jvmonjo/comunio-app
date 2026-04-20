import { createClient } from '@supabase/supabase-js'

export function useEventSettings() {
  const config = useRuntimeConfig()
  const settings = useState<any>('event-settings', () => ({
    id: 1,
    child_name: 'Marc',
    event_date: '2026-05-17T12:00:00+02:00',
    ceremony_location: 'Parròquia de Sant Joan, Alzira',
    restaurant_location: 'al jardí de la família amb dinar',
    contact_parents: 'Ana i Vicent',
    contact_phone: '+34 600 123 123'
  }))

  function getClient() {
    if (!config.public.supabaseUrl || !config.public.supabaseAnonKey) return null
    return createClient(config.public.supabaseUrl, config.public.supabaseAnonKey)
  }

  async function fetchSettings() {
    const supabase = getClient()
    if (!supabase) return
    const { data } = await supabase.from('event_settings').select('*').eq('id', 1).single()
    if (data) {
      settings.value = data
    }
  }

  return { settings, fetchSettings }
}
