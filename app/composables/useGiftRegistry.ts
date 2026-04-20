import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface PurchaseOption {
  store_name: string
  link?: string
  price?: number
}

export interface GiftItem {
  id: string
  name: string
  description: string
  price?: number | null
  image_url?: string | null
  purchase_options?: PurchaseOption[] | null
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
    image_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80',
    purchase_options: [{ store_name: 'Decathlon', price: 185, link: 'https://decathlon.es' }],
    assigned_to: null
  },
  {
    id: 'lego',
    name: 'Lego gran',
    description: 'Un set creatiu per a construir en família i continuar jugant després de la festa.',
    price: 79,
    image_url: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=400&q=80',
    purchase_options: [{ store_name: 'Amazon', price: 75, link: 'https://amazon.es' }, { store_name: 'El Corte Inglés', price: 79 }],
    assigned_to: null
  },
  {
    id: 'watch',
    name: 'Rellotge',
    description: 'Un record especial del dia de la comunio.',
    price: 120,
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
    purchase_options: [{ store_name: 'Rellotgeria local', price: 120 }],
    assigned_to: 'Els iaios'
  },
  {
    id: 'books',
    name: 'Llibres d\'aventures',
    description: 'Pack de lectures per a l\'estiu amb històries d\'exploradors i misteris.',
    price: 45,
    image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
    purchase_options: [{ store_name: 'Casa del Llibre', price: 45, link: 'https://casadellibro.com' }],
    assigned_to: null
  }
]

function normalizeGift(raw: Partial<GiftItem> & { id: string, name: string, description: string }): GiftItem {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    price: raw.price ?? null,
    image_url: raw.image_url ?? null,
    purchase_options: raw.purchase_options ?? [],
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
  let supabaseClient: SupabaseClient | null = null

  const isConfigured = computed(() =>
    Boolean(config.public.supabaseUrl && config.public.supabaseAnonKey)
  )

  function getClient() {
    if (!isConfigured.value) {
      return null
    }

    if (!supabaseClient) {
      supabaseClient = createClient(
        config.public.supabaseUrl,
        config.public.supabaseAnonKey
      )
    }

    return supabaseClient
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
        .select('id, name, description, price, image_url, purchase_options, assigned_to, guest_message, assigned_at')
        .order('created_at', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      gifts.value = (data ?? []).map(item => normalizeGift(item))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'No s\'han pogut carregar els regals.'
    } finally {
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No s\'ha pogut completar la reserva.'
      error.value = message
      return { ok: false, message }
    } finally {
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
