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
    contact_phone: '+34 600 123 123',
    theme: 'amber'
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

  const themeClasses = computed(() => {
    const t = settings.value?.theme || 'amber'
    if (t === 'blue') {
      return {
        bgMain: 'min-h-[100dvh] bg-[linear-gradient(180deg,_#f0f9ff_0%,_#ffffff_45%,_#f0f9ff_100%)] text-slate-800',
        heroAccentText: 'text-sky-600',
        badgeSoft: 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-300/50',
        heroIconColor: 'text-sky-600',
        heroIconBg: 'bg-sky-50 border-sky-200',
        cardMainBg: 'bg-white text-slate-800 shadow-[0_20px_60px_-15px_rgba(14,165,233,0.15)] ring-1 ring-slate-100',
        cardLabel: 'text-sky-700',
        cardSecBg: 'bg-gradient-to-b from-sky-50 to-white ring-1 ring-sky-100',
        subText: 'text-slate-500',
        inverseText: 'text-slate-700',
        btnPrimary: 'sky',
        btnSecondary: 'sky',
        inputColor: 'sky',
        loaderBg: 'bg-sky-50',
        loaderIcon: 'text-sky-500',
        loaderText: 'text-sky-900'
      }
    } else if (t === 'pink') {
      return {
        bgMain: 'min-h-[100dvh] bg-[linear-gradient(180deg,_#fdf2f8_0%,_#ffffff_45%,_#fce7f3_100%)] text-slate-800',
        heroAccentText: 'text-pink-600',
        badgeSoft: 'bg-pink-100 text-pink-700 ring-1 ring-inset ring-pink-300/50',
        heroIconColor: 'text-pink-600',
        heroIconBg: 'bg-pink-50 border-pink-200',
        cardMainBg: 'bg-white text-slate-800 shadow-[0_20px_60px_-15px_rgba(236,72,153,0.15)] ring-1 ring-slate-100',
        cardLabel: 'text-pink-700',
        cardSecBg: 'bg-gradient-to-b from-pink-50 to-white ring-1 ring-pink-100',
        subText: 'text-slate-500',
        inverseText: 'text-slate-700',
        btnPrimary: 'pink',
        btnSecondary: 'pink',
        inputColor: 'pink',
        loaderBg: 'bg-pink-50',
        loaderIcon: 'text-pink-500',
        loaderText: 'text-pink-900'
      }
    }
    return {
      bgMain: 'min-h-[100dvh] bg-[linear-gradient(180deg,_#fffaf2_0%,_#ffffff_45%,_#fffaf2_100%)] text-stone-800',
      heroAccentText: 'text-amber-600',
      badgeSoft: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-300/50',
      heroIconColor: 'text-amber-600',
      heroIconBg: 'bg-amber-50 border-amber-200',
      cardMainBg: 'bg-white text-stone-800 shadow-[0_20px_60px_-15px_rgba(217,119,6,0.15)] ring-1 ring-stone-100',
      cardLabel: 'text-amber-700',
      cardSecBg: 'bg-gradient-to-b from-amber-50 to-white ring-1 ring-amber-100',
      subText: 'text-stone-500',
      inverseText: 'text-stone-700',
      btnPrimary: 'amber',
      btnSecondary: 'amber',
      inputColor: 'amber',
      loaderBg: 'bg-[#fffaf2]',
      loaderIcon: 'text-amber-500',
      loaderText: 'text-amber-900'
    }
  })

  return { settings, fetchSettings, themeClasses }
}
