<script setup lang="ts">
import type { GiftItem } from '~/composables/useGiftRegistry'

useSeoMeta({
  title: 'Primera Comunio de Marc',
  description: 'Landing page amb informació de l\'esdeveniment i reserva de regals.'
})

const eventDate = new Date('2026-05-17T12:00:00+02:00')

const {
  gifts,
  isConfigured,
  isLoading,
  isSubmitting,
  error,
  fetchGifts,
  reserveGift
} = useGiftRegistry()

const selectedGiftId = ref<string | null>(null)
const guestName = ref('')
const guestMessage = ref('')
const feedback = ref<{ tone: 'success' | 'error' | 'info', text: string } | null>(null)
const now = ref(Date.now())

let timer: ReturnType<typeof setInterval> | null = null

const selectedGift = computed(() =>
  gifts.value.find(gift => gift.id === selectedGiftId.value) ?? null
)

const availableGifts = computed(() =>
  gifts.value.filter(gift => !gift.assigned_to)
)

const reservedGifts = computed(() =>
  gifts.value.filter(gift => gift.assigned_to)
)

const countdown = computed(() => {
  const distance = eventDate.getTime() - now.value

  if (distance <= 0) {
    return { days: 0, hours: 0, minutes: 0 }
  }

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60)
  }
})

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat('ca-ES', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(date)
}

function selectGift(gift: GiftItem) {
  if (gift.assigned_to) {
    return
  }

  selectedGiftId.value = gift.id
  feedback.value = null
}

async function handleReserveGift() {
  feedback.value = null

  if (!selectedGift.value) {
    feedback.value = {
      tone: 'error',
      text: 'Tria primer un regal disponible.'
    }
    return
  }

  if (!guestName.value.trim()) {
    feedback.value = {
      tone: 'error',
      text: 'Escriu el teu nom per poder reservar.'
    }
    return
  }

  const result = await reserveGift({
    giftId: selectedGift.value.id,
    guestName: guestName.value.trim(),
    guestMessage: guestMessage.value.trim()
  })

  if (!result.ok) {
    feedback.value = {
      tone: 'error',
      text: result.message
    }
    return
  }

  feedback.value = {
    tone: 'success',
    text: `Has reservat "${selectedGift.value.name}". Gràcies!`
  }
  guestName.value = ''
  guestMessage.value = ''
  selectedGiftId.value = null
}

onMounted(async () => {
  await fetchGifts()
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000 * 30)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(251,113,133,0.16),_transparent_28%),linear-gradient(180deg,_#fffaf2_0%,_#fffdf8_45%,_#fff7ed_100%)] text-stone-900">
    <div class="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header class="mb-8 flex flex-col gap-5 rounded-[2rem] border border-white/70 bg-white/75 px-6 py-5 shadow-[0_24px_80px_-40px_rgba(120,53,15,0.45)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-3">
            <UBadge color="warning" variant="soft" size="lg" class="rounded-full px-3 py-1">
              Primera Comunio
            </UBadge>
            <UBadge
              :color="isConfigured ? 'success' : 'neutral'"
              variant="subtle"
              class="rounded-full px-3 py-1"
            >
              {{ isConfigured ? 'Supabase connectat' : 'Mode demo' }}
            </UBadge>
          </div>
          <h1 class="max-w-2xl text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
            Marc celebra un dia molt especial i ens encantaria compartir-lo amb tu.
          </h1>
        </div>

        <div class="grid grid-cols-3 gap-3 rounded-[1.75rem] bg-stone-950 p-4 text-center text-stone-50 shadow-xl">
          <div class="rounded-2xl bg-white/8 px-4 py-3">
            <div class="text-3xl font-bold">{{ countdown.days }}</div>
            <div class="text-xs uppercase tracking-[0.24em] text-stone-300">dies</div>
          </div>
          <div class="rounded-2xl bg-white/8 px-4 py-3">
            <div class="text-3xl font-bold">{{ countdown.hours }}</div>
            <div class="text-xs uppercase tracking-[0.24em] text-stone-300">hores</div>
          </div>
          <div class="rounded-2xl bg-white/8 px-4 py-3">
            <div class="text-3xl font-bold">{{ countdown.minutes }}</div>
            <div class="text-xs uppercase tracking-[0.24em] text-stone-300">minuts</div>
          </div>
        </div>
      </header>

      <section class="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <UCard class="overflow-hidden rounded-[2rem] border-0 bg-stone-950 text-stone-50 shadow-[0_28px_90px_-45px_rgba(28,25,23,0.95)]">
          <div class="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div class="space-y-6">
              <div class="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm text-amber-100">
                <UIcon name="i-lucide-sparkles" class="h-4 w-4" />
                Una celebració menuda, càlida i familiar
              </div>

              <div>
                <p class="mb-3 text-sm uppercase tracking-[0.28em] text-amber-200/70">
                  Diumenge 17 de maig de 2026
                </p>
                <p class="max-w-xl text-lg leading-8 text-stone-200">
                  T’esperem a la parròquia de Sant Joan a les 12:00 i després continuarem la festa al jardí de la família amb dinar, música i una vesprada tranquil·la.
                </p>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div class="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <div class="mb-3 flex items-center gap-3">
                    <div class="rounded-2xl bg-amber-300/15 p-3 text-amber-200">
                      <UIcon name="i-lucide-calendar-heart" class="h-5 w-5" />
                    </div>
                    <div class="text-sm font-semibold uppercase tracking-[0.18em] text-stone-300">Data</div>
                  </div>
                  <p class="text-base text-stone-100">{{ formatEventDate(eventDate) }}</p>
                </div>

                <div class="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <div class="mb-3 flex items-center gap-3">
                    <div class="rounded-2xl bg-rose-300/15 p-3 text-rose-200">
                      <UIcon name="i-lucide-map-pinned" class="h-5 w-5" />
                    </div>
                    <div class="text-sm font-semibold uppercase tracking-[0.18em] text-stone-300">Ubicació</div>
                  </div>
                  <p class="text-base text-stone-100">Parròquia de Sant Joan, Alzira</p>
                </div>
              </div>
            </div>

            <div class="flex flex-col justify-between rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(251,191,36,0.14),rgba(251,146,60,0.04))] p-6 ring-1 ring-white/10">
              <div>
                <p class="text-sm uppercase tracking-[0.28em] text-amber-100/80">Informació pràctica</p>
                <ul class="mt-5 space-y-4 text-sm leading-7 text-stone-200">
                  <li class="flex gap-3">
                    <UIcon name="i-lucide-shirt" class="mt-1 h-4 w-4 shrink-0 text-amber-200" />
                    Vestimenta formal però còmoda.
                  </li>
                  <li class="flex gap-3">
                    <UIcon name="i-lucide-party-popper" class="mt-1 h-4 w-4 shrink-0 text-amber-200" />
                    Després de la missa hi haurà dinar i espai de jocs per als menuts.
                  </li>
                  <li class="flex gap-3">
                    <UIcon name="i-lucide-gift" class="mt-1 h-4 w-4 shrink-0 text-amber-200" />
                    Si vols fer un detall, pots reservar un regal des de la llista d’ací baix.
                  </li>
                </ul>
              </div>

              <div class="mt-8 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-stone-200">
                <p class="font-semibold text-white">Contacte familiar</p>
                <p class="mt-2">Ana i Vicent · +34 600 123 123</p>
              </div>
            </div>
          </div>
        </UCard>

        <UCard class="rounded-[2rem] border-0 bg-white/80 shadow-[0_24px_80px_-42px_rgba(120,53,15,0.45)] backdrop-blur">
          <div class="space-y-5">
            <div>
              <p class="text-sm uppercase tracking-[0.28em] text-amber-700">Resum</p>
              <h2 class="mt-2 text-2xl font-bold text-stone-900">Regals i reserves</h2>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-[1.5rem] bg-emerald-50 p-4 ring-1 ring-emerald-100">
                <p class="text-sm text-emerald-700">Disponibles</p>
                <p class="mt-2 text-3xl font-bold text-emerald-950">{{ availableGifts.length }}</p>
              </div>
              <div class="rounded-[1.5rem] bg-amber-50 p-4 ring-1 ring-amber-100">
                <p class="text-sm text-amber-700">Reservats</p>
                <p class="mt-2 text-3xl font-bold text-amber-950">{{ reservedGifts.length }}</p>
              </div>
            </div>

            <div class="rounded-[1.5rem] bg-stone-50 p-4 ring-1 ring-stone-200">
              <p class="text-sm font-medium text-stone-800">
                {{ isConfigured ? 'Les reserves es guarden en Supabase.' : 'Sense variables d’entorn, la pàgina funciona en mode demostració.' }}
              </p>
              <p class="mt-2 text-sm text-stone-600">
                Això et permet revisar el disseny i el flux abans de connectar la base de dades real.
              </p>
            </div>

            <UButton
              block
              color="neutral"
              variant="subtle"
              icon="i-lucide-refresh-cw"
              :loading="isLoading"
              @click="fetchGifts"
            >
              Actualitzar llista
            </UButton>
          </div>
        </UCard>
      </section>

      <section class="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div class="space-y-5">
          <div class="flex items-end justify-between gap-4">
            <div>
              <p class="text-sm uppercase tracking-[0.28em] text-amber-700">Llista de regals</p>
              <h2 class="mt-2 text-3xl font-bold text-stone-900">Tria un detall si et ve de gust</h2>
            </div>
          </div>

          <div v-if="error" class="rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {{ error }}
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <UCard
              v-for="gift in gifts"
              :key="gift.id"
              class="rounded-[1.75rem] border-0 shadow-[0_20px_60px_-36px_rgba(120,53,15,0.35)] transition-transform duration-200 hover:-translate-y-1"
              :class="gift.assigned_to ? 'bg-stone-100/90' : 'bg-white/85'"
            >
              <div class="flex h-full flex-col">
                <div class="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div class="mb-2 flex items-center gap-2">
                      <UBadge
                        :color="gift.assigned_to ? 'neutral' : 'success'"
                        variant="subtle"
                        class="rounded-full"
                      >
                        {{ gift.assigned_to ? 'Reservat' : 'Disponible' }}
                      </UBadge>
                      <span v-if="gift.price" class="text-sm font-semibold text-stone-500">{{ gift.price }} €</span>
                    </div>
                    <h3 class="text-xl font-semibold text-stone-900">{{ gift.name }}</h3>
                  </div>
                  <div class="rounded-2xl p-3" :class="gift.assigned_to ? 'bg-stone-200 text-stone-500' : 'bg-emerald-100 text-emerald-700'">
                    <UIcon :name="gift.icon || 'i-lucide-gift'" class="h-5 w-5" />
                  </div>
                </div>

                <p class="mb-4 text-sm leading-6 text-stone-600">{{ gift.description }}</p>

                <div v-if="gift.assigned_to" class="mb-5 rounded-[1.25rem] bg-white/70 p-3 text-sm text-stone-600 ring-1 ring-stone-200">
                  Reservat per <span class="font-semibold text-stone-900">{{ gift.assigned_to }}</span>
                </div>

                <div class="mt-auto">
                  <UButton
                    block
                    :color="gift.assigned_to ? 'neutral' : 'primary'"
                    :variant="gift.assigned_to ? 'subtle' : 'solid'"
                    :disabled="Boolean(gift.assigned_to)"
                    @click="selectGift(gift)"
                  >
                    {{ selectedGiftId === gift.id ? 'Seleccionat' : (gift.assigned_to ? 'Ja reservat' : 'Seleccionar regal') }}
                  </UButton>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <div class="lg:sticky lg:top-6 lg:self-start">
          <UCard class="rounded-[2rem] border-0 bg-stone-950 text-stone-50 shadow-[0_28px_80px_-42px_rgba(28,25,23,0.95)]">
            <div class="space-y-5">
              <div>
                <p class="text-sm uppercase tracking-[0.28em] text-amber-200/70">Reserva</p>
                <h2 class="mt-2 text-2xl font-bold">Assigna el teu regal</h2>
                <p class="mt-2 text-sm leading-6 text-stone-300">
                  Només necessitem el teu nom. Si el regal ja l’ha agafat una altra persona, t’avisarem.
                </p>
              </div>

              <div class="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p class="text-xs uppercase tracking-[0.22em] text-stone-400">Regal seleccionat</p>
                <p class="mt-2 text-lg font-semibold text-white">
                  {{ selectedGift?.name || 'Encara no n’has triat cap' }}
                </p>
                <p class="mt-2 text-sm leading-6 text-stone-300">
                  {{ selectedGift?.description || 'Selecciona un regal disponible de la llista per a completar la reserva.' }}
                </p>
              </div>

              <div
                v-if="feedback"
                class="rounded-[1.5rem] p-4 text-sm"
                :class="feedback.tone === 'success'
                  ? 'bg-emerald-400/10 text-emerald-100 ring-1 ring-emerald-400/20'
                  : feedback.tone === 'error'
                    ? 'bg-red-400/10 text-red-100 ring-1 ring-red-400/20'
                    : 'bg-white/8 text-stone-100 ring-1 ring-white/10'"
              >
                {{ feedback.text }}
              </div>

              <div class="space-y-4">
                <div>
                  <label class="mb-2 block text-sm font-medium text-stone-200">El teu nom</label>
                  <UInput
                    v-model="guestName"
                    size="xl"
                    color="neutral"
                    variant="outline"
                    placeholder="Ex. Maria i Joan"
                    class="w-full"
                  />
                </div>

                <div>
                  <label class="mb-2 block text-sm font-medium text-stone-200">Missatge opcional</label>
                  <UTextarea
                    v-model="guestMessage"
                    :rows="4"
                    color="neutral"
                    variant="outline"
                    placeholder="Ex. Moltes ganes d’acompanyar-vos en aquest dia."
                    class="w-full"
                  />
                </div>
              </div>

              <UButton
                block
                size="xl"
                color="warning"
                icon="i-lucide-check"
                :loading="isSubmitting"
                @click="handleReserveGift"
              >
                Reservar regal
              </UButton>
            </div>
          </UCard>
        </div>
      </section>
    </div>
  </div>
</template>
