import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface GiftItem {
  id: string
  name: string
  description: string
  price?: number | null
  icon?: string | null
  assigned_to?: string | null
  guest_message?: string | null
  assigned_at?: string | null
}

interface ReserveGiftInput {
  giftId: string
  guestName: string
  guestMessage?: string
}

const demoGifts: GiftItem[] = [
  {
    id: 'bike',
    name: 'Bicicleta',
    description: 'Per a eixir els caps de setmana i estrenar noves aventures.',
    price: 185,
    icon: 'i-lucide-bike',
    assigned_to: null
  },
  {
    id: 'lego',
    name: 'Lego gran',
    description: 'Un set creatiu per a construir en família i continuar jugant després de la festa.',
    price: 79,
    icon: 'i-lucide-blocks',
    assigned_to: null
  },
  {
    id: 'watch',
    name: 'Rellotge',
    description: 'Un record especial del dia de la comunio.',
    price: 120,
    icon: 'i-lucide-watch',
    assigned_to: 'Els iaios'
  },
  {
    id: 'books',
    name: 'Llibres d\'aventures',
    description: 'Pack de lectures per a l\'estiu amb històries d\'exploradors i misteris.',
    price: 45,
    icon: 'i-lucide-book-open',
    assigned_to: null
  }
]

function normalizeGift(raw: Partial<GiftItem> & { id: string, name: string, description: string }): GiftItem {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    price: raw.price ?? null,
    icon: raw.icon ?? 'i-lucide-gift',
    assigned_to: raw.assigned_to ?? null,
    guest_message: raw.guest_message ?? null,
    assigned_at: raw.assigned_at ?? null
  }
}

export function useGiftRegistry() {
  const config = useRuntimeConfig()
  const gifts = useState<GiftItem[]>('gift-registry:gifts', () => [])
  const isLoading = useState<boolean>('gift-registry:loading', () => false)
  const isSubmitting = useState<boolean>('gift-registry:submitting', () => false)
  const error = useState<string | null>('gift-registry:error', () => null)
  const client = useState<SupabaseClient | null>('gift-registry:client', () => null)

  const isConfigured = computed(() =>
    Boolean(config.public.supabaseUrl && config.public.supabaseAnonKey)
  )

  function getClient() {
    if (!isConfigured.value) {
      return null
    }

    if (!client.value) {
      client.value = createClient(
        config.public.supabaseUrl,
        config.public.supabaseAnonKey
      )
    }

    return client.value
  }

  async function fetchGifts() {
    isLoading.value = true
    error.value = null

    try {
      const supabase = getClient()

      if (!supabase) {
        gifts.value = demoGifts.map(normalizeGift)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('gifts')
        .select('id, name, description, price, icon, assigned_to, guest_message, assigned_at')
        .order('created_at', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      gifts.value = (data ?? []).map(item => normalizeGift(item))
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'No s\'han pogut carregar els regals.'
    }
    finally {
      isLoading.value = false
    }
  }

  async function reserveGift(input: ReserveGiftInput) {
    isSubmitting.value = true
    error.value = null

    try {
      const supabase = getClient()

      if (!supabase) {
        const targetGift = gifts.value.find(gift => gift.id === input.giftId)

        if (!targetGift || targetGift.assigned_to) {
          return { ok: false, message: 'Aquest regal ja no està disponible.' }
        }

        targetGift.assigned_to = input.guestName
        targetGift.guest_message = input.guestMessage || null
        targetGift.assigned_at = new Date().toISOString()
        gifts.value = [...gifts.value]

        return { ok: true, message: 'Regal reservat en mode demo.' }
      }

      const { data, error: reserveError } = await supabase
        .from('gifts')
        .update({
          assigned_to: input.guestName,
          guest_message: input.guestMessage || null,
          assigned_at: new Date().toISOString()
        })
        .eq('id', input.giftId)
        .is('assigned_to', null)
        .select('id')
        .maybeSingle()

      if (reserveError) {
        throw reserveError
      }

      if (!data) {
        return { ok: false, message: 'Algú ha reservat aquest regal abans que tu.' }
      }

      await fetchGifts()

      return { ok: true, message: 'Regal reservat correctament.' }
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'No s\'ha pogut completar la reserva.'
      error.value = message
      return { ok: false, message }
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    gifts,
    isConfigured,
    isLoading,
    isSubmitting,
    error,
    fetchGifts,
    reserveGift
  }
}
