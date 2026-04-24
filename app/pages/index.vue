<script setup lang="ts">
import type { GiftItem } from '~/composables/useGiftRegistry'

const { settings, fetchSettings, themeClasses: th } = useEventSettings()

useSeoMeta({
  title: computed(() => `Primera Comunió de ${settings.value.child_name}`),
  ogTitle: computed(() => `Primera Comunió de ${settings.value.child_name}`),
  twitterTitle: computed(() => `Primera Comunió de ${settings.value.child_name}`),
  description: 'Pàgina web amb informació de l\'esdeveniment i reserva de regals.',
  ogDescription: 'Pàgina web amb informació de l\'esdeveniment i reserva de regals.',
  twitterDescription: 'Pàgina web amb informació de l\'esdeveniment i reserva de regals.',
  twitterCard: 'summary_large_image',
  ogImage: computed(() => settings.value.logo_url || '/icon.png'),
  twitterImage: computed(() => settings.value.logo_url || '/icon.png')
})

const eventDate = computed(() => new Date(settings.value.event_date))

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
  const distance = eventDate.value.getTime() - now.value

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

const formattedDateLong = computed(() =>
  new Intl.DateTimeFormat('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(eventDate.value)
)
const formattedTime = computed(() =>
  new Intl.DateTimeFormat('ca-ES', { hour: '2-digit', minute: '2-digit' }).format(eventDate.value)
)

function selectGift(gift: GiftItem) {
  if (gift.assigned_to) {
    return
  }

  if (selectedGiftId.value === gift.id) {
    selectedGiftId.value = null
  } else {
    selectedGiftId.value = gift.id
    feedback.value = null
  }
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

const isReady = ref(true)

await useAsyncData('page-init', async () => {
  await Promise.all([fetchSettings(), fetchGifts()])
  return true
})

onMounted(() => {
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
  <div v-if="!isReady" :class="['flex min-h-[100dvh] items-center justify-center', th.loaderBg]">
    <div class="flex flex-col items-center gap-4">
      <UIcon name="i-lucide-loader-2" :class="['h-10 w-10 animate-spin', th.loaderIcon]" />
      <span :class="['text-sm font-medium tracking-widest opacity-60 uppercase', th.loaderText]">Carregant...</span>
    </div>
  </div>

  <div v-else :class="th.bgMain">
    <div class="mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col px-4 pt-6 pb-32 sm:px-6 lg:px-8">
      <header
        class="mb-8 flex flex-col gap-5 rounded-[2rem] border border-white/70 bg-white/75 px-6 py-5 shadow-[0_24px_80px_-40px_rgba(120,53,15,0.45)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-3">
            <template v-if="settings.logo_url">
              <img :src="settings.logo_url" alt="Logo" class="h-16 w-auto object-contain sm:h-24">
            </template>
            <span v-else :class="['inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', th.badgeSoft]">
              Primera Comunió
            </span>
            <UBadge v-if="!isConfigured" color="neutral" variant="subtle" class="rounded-full px-3 py-1">
              Mode demo
            </UBadge>
          </div>
          <h1 class="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl" :class="th.inverseText">
            <span class="marker-underline" :class="th.heroAccentText" :style="{ '--marker-color': th.markerColor }">
              {{ settings.child_name }}
            </span>
            celebra un dia molt especial i ens encantaria compartir-lo amb tu.
          </h1>
        </div>

        <div :class="['grid grid-cols-3 gap-3 rounded-[1.75rem] p-4 text-center', th.cardMainBg]">
          <div :class="['rounded-2xl px-4 py-3 bg-black/5']">
            <div class="text-3xl font-bold">
              {{ countdown.days }}
            </div>
            <div :class="['text-xs uppercase tracking-[0.24em]', th.subText]">
              dies
            </div>
          </div>
          <div :class="['rounded-2xl px-4 py-3 bg-black/5']">
            <div class="text-3xl font-bold">
              {{ countdown.hours }}
            </div>
            <div :class="['text-xs uppercase tracking-[0.24em]', th.subText]">
              hores
            </div>
          </div>
          <div :class="['rounded-2xl px-4 py-3 bg-black/5']">
            <div class="text-3xl font-bold">
              {{ countdown.minutes }}
            </div>
            <div :class="['text-xs uppercase tracking-[0.24em]', th.subText]">
              minuts
            </div>
          </div>
        </div>
      </header>

      <section class="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <UCard :class="['overflow-hidden rounded-[2rem] border-0', th.cardMainBg]">
          <div class="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div class="space-y-6">
              <div
                :class="['inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm', th.heroIconBg, th.heroIconColor]">
                <UIcon name="i-lucide-sparkles" class="h-4 w-4" />
                Detalls de la celebració
              </div>

              <div>
                <p :class="['mb-3 text-sm uppercase tracking-[0.28em] font-medium', th.heroAccentText]">
                  {{ formattedDateLong }}
                </p>
                <p :class="['max-w-xl text-lg leading-8', th.inverseText]">
                  T’esperem a
                  <a v-if="settings.ceremony_url" :href="settings.ceremony_url" target="_blank"
                    class="font-semibold underline decoration-dotted underline-offset-4 hover:text-amber-600 transition-colors">
                    {{ settings.ceremony_location }}
                  </a>
                  <span v-else class="font-semibold">{{ settings.ceremony_location }}</span>
                  a les {{ formattedTime }} i després continuarem la festa
                  <a v-if="settings.restaurant_url" :href="settings.restaurant_url" target="_blank"
                    class="font-semibold underline decoration-dotted underline-offset-4 hover:text-amber-600 transition-colors">
                    {{ settings.restaurant_location }}
                  </a>
                  <span v-else class="font-semibold">{{ settings.restaurant_location }}</span>.
                </p>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div class="rounded-[1.5rem] border border-black/5 bg-black/5 p-5">
                  <div class="mb-3 flex items-center gap-3">
                    <div :class="['rounded-2xl p-3', th.heroIconBg, th.heroIconColor]">
                      <UIcon name="i-lucide-calendar-heart" class="h-5 w-5" />
                    </div>
                    <div :class="['text-sm font-semibold uppercase tracking-[0.18em]', th.subText]">
                      Data
                    </div>
                  </div>
                  <p class="text-base font-medium">
                    {{ formatEventDate(eventDate) }}
                  </p>
                </div>

                <div class="rounded-[1.5rem] border border-black/5 bg-black/5 p-5">
                  <div class="mb-3 flex items-center gap-3">
                    <div :class="['rounded-2xl p-3', th.heroIconBg, th.heroIconColor]">
                      <UIcon name="i-lucide-map-pinned" class="h-5 w-5" />
                    </div>
                    <div :class="['text-sm font-semibold uppercase tracking-[0.18em]', th.subText]">
                      Ubicació
                    </div>
                  </div>
                  <div v-if="settings.ceremony_url" class="mt-2 text-base font-medium">
                    <a :href="settings.ceremony_url" target="_blank"
                      class="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-800 transition-colors underline underline-offset-4 decoration-amber-700/30">
                      {{ settings.ceremony_location }}
                      <UIcon name="i-lucide-external-link" class="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <p v-else class="text-base font-medium">
                    {{ settings.ceremony_location }}
                  </p>
                </div>
              </div>
            </div>

            <div :class="['flex flex-col justify-between rounded-[1.75rem] p-6', th.cardSecBg]">
              <div>
                <p :class="['text-sm uppercase tracking-[0.28em] font-semibold', th.cardLabel]">
                  Informació pràctica
                </p>
                <ul :class="['mt-5 space-y-4 text-sm leading-7', th.inverseText]">
                  <li class="flex gap-3">
                    <UIcon name="i-lucide-shirt" :class="['mt-1 h-4 w-4 shrink-0', th.heroAccentText]" />
                    Vestimenta formal però còmoda.
                  </li>
                  <li class="flex gap-3">
                    <UIcon name="i-lucide-party-popper" :class="['mt-1 h-4 w-4 shrink-0', th.heroAccentText]" />
                    Després de la missa hi haurà dinar i espai de jocs per als menuts.
                  </li>
                  <li class="flex gap-3">
                    <UIcon name="i-lucide-gift" :class="['mt-1 h-4 w-4 shrink-0', th.heroAccentText]" />
                    Si vols fer un detall, i no saps què regalar, pots reservar un regal des de la llista d’ací baix,
                    per a
                    evitar duplicitats.
                  </li>
                </ul>
              </div>

              <div class="mt-8 rounded-[1.5rem] border border-black/5 bg-white/50 p-4 text-sm mix-blend-multiply">
                <p class="font-semibold text-black">
                  Contacte familiar
                </p>
                <p :class="['mt-2', th.subText]">
                  {{ settings.contact_parents }} · {{ settings.contact_phone }}
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <UCard
          class="rounded-[2rem] border-0 bg-white/80 shadow-[0_24px_80px_-42px_rgba(120,53,15,0.45)] backdrop-blur">
          <div class="space-y-5">
            <div>
              <p class="text-sm uppercase tracking-[0.28em] text-amber-700">
                Resum
              </p>
              <h2 class="mt-2 text-2xl font-bold text-stone-900">
                Regals i reserves
              </h2>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-[1.5rem] bg-emerald-50 p-4 ring-1 ring-emerald-100">
                <p class="text-sm text-emerald-700">
                  Disponibles
                </p>
                <p class="mt-2 text-3xl font-bold text-emerald-950">
                  {{ availableGifts.length }}
                </p>
              </div>
              <div class="rounded-[1.5rem] bg-amber-50 p-4 ring-1 ring-amber-100">
                <p class="text-sm text-amber-700">
                  Reservats
                </p>
                <p class="mt-2 text-3xl font-bold text-amber-950">
                  {{ reservedGifts.length }}
                </p>
              </div>
            </div>

            <div v-if="!isConfigured" class="rounded-[1.5rem] bg-stone-50 p-4 ring-1 ring-stone-200">
              <p class="text-sm font-medium text-stone-800">
                Sense variables d’entorn, la pàgina funciona en mode demostració.
              </p>
              <p class="mt-2 text-sm text-stone-600">
                Això et permet revisar el disseny i el flux abans de connectar la base de dades real.
              </p>
            </div>

            <UButton block color="neutral" variant="subtle" icon="i-lucide-refresh-cw" :loading="isLoading"
              @click="fetchGifts">
              Actualitzar llista
            </UButton>
          </div>
        </UCard>
      </section>

      <section class="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div class="space-y-5">
          <div class="flex items-end justify-between gap-4">
            <div>
              <p :class="['text-sm uppercase tracking-[0.28em] font-semibold', th.cardLabel]">
                Llista de regals
              </p>
              <h2 :class="['mt-2 text-3xl font-bold', th.inverseText]">
                Tria un detall si et ve de gust
              </h2>
            </div>
          </div>

          <div v-if="error" class="rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {{ error }}
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <UCard v-for="gift in gifts" :key="gift.id"
              class="rounded-[1.75rem] border-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] ring-1 transition-all duration-250 hover:-translate-y-1"
              :class="[
                gift.assigned_to ? 'bg-black/5 ring-black/5 opacity-80' :
                  selectedGiftId === gift.id ? 'bg-amber-50/50 ring-amber-500/50 -translate-y-1 shadow-[0_24px_80px_-20px_rgba(245,158,11,0.2)]' : 'bg-white ring-black/5'
              ]">
              <div class="flex h-full flex-col">
                <div v-if="gift.image_url" class="-mx-6 -mt-6 mb-5 h-48 sm:h-56 overflow-hidden rounded-t-[1.75rem]">
                  <img :src="gift.image_url" :alt="gift.name"
                    class="h-full w-full object-cover transition-transform duration-500 hover:scale-105">
                </div>

                <div class="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div class="mb-2 flex items-center gap-2">
                      <span
                        :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', gift.assigned_to ? 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/10' : th.badgeSoft]">
                        {{ gift.assigned_to ? 'Reservat' : 'Disponible' }}
                      </span>
                      <span v-if="gift.price" :class="['text-sm font-semibold', th.subText]">{{ gift.price }} €</span>
                    </div>
                    <h3 :class="['text-xl font-semibold', th.inverseText]">
                      {{ gift.name }}
                    </h3>
                  </div>
                </div>

                <p :class="['mb-4 text-sm leading-6', th.subText]">
                  {{ gift.description }}
                </p>

                <div v-if="gift.purchase_options && gift.purchase_options.length > 0" class="mb-5">
                  <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                    Suggeriments de compra
                  </p>
                  <ul class="space-y-2">
                    <li v-for="(opt, idx) in gift.purchase_options" :key="idx"
                      class="flex justify-between items-center rounded-xl bg-slate-50 p-3 ring-1 ring-slate-900/5 transition-colors hover:bg-slate-100 text-sm">
                      <div class="flex items-center gap-2 text-slate-700">
                        <UIcon name="i-lucide-shopping-bag" :class="['h-4 w-4', th.heroAccentText]" />
                        <span class="font-medium">{{ opt.store_name }}</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <span v-if="opt.price" class="text-slate-500 font-medium">{{ opt.price }} €</span>
                        <a v-if="opt.link" :href="opt.link" target="_blank" rel="noopener noreferrer"
                          :class="['transition-colors p-1 rounded-full flex items-center justify-center hover:bg-black/5', th.heroAccentText]"
                          title="Veure a la tenda">
                          <UIcon name="i-lucide-external-link" class="h-4 w-4" />
                        </a>
                      </div>
                    </li>
                  </ul>
                </div>

                <div v-if="gift.assigned_to"
                  class="mb-5 flex items-center justify-center gap-2 rounded-[1.25rem] bg-black/5 p-3 text-sm font-medium text-slate-500 ring-1 ring-slate-200/60">
                  <UIcon name="i-lucide-lock" class="h-4 w-4" />
                  Aquest regal ja ha estat reservat
                </div>

                <div class="mt-auto">
                  <UButton block
                    :color="(gift.assigned_to ? 'neutral' : (selectedGiftId === gift.id ? 'warning' : th.btnPrimary)) as any"
                    :variant="gift.assigned_to || selectedGiftId === gift.id ? 'subtle' : 'solid'"
                    :disabled="Boolean(gift.assigned_to)" :icon="selectedGiftId === gift.id ? 'i-lucide-x' : ''"
                    @click="selectGift(gift)">
                    <span v-if="selectedGiftId === gift.id">Desseleccionar</span>
                    <span v-else-if="gift.assigned_to">Ja reservat</span>
                    <span v-else>Seleccionar regal</span>
                  </UButton>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <div class="lg:sticky lg:top-6 lg:self-start">
          <UCard :class="['rounded-[2rem] border-0', th.cardMainBg]">
            <div class="space-y-5">
              <div>
                <p :class="['text-sm uppercase tracking-[0.28em] font-semibold', th.cardLabel]">
                  Reserva
                </p>
                <h2 :class="['mt-2 text-2xl font-bold', th.inverseText]">
                  Assigna el teu regal
                </h2>
                <p :class="['mt-2 text-sm leading-6', th.subText]">
                  Només necessitem el teu nom. Si el regal ja l’ha agafat una altra persona, t’avisarem.
                </p>
              </div>

              <div class="rounded-[1.5rem] bg-black/5 ring-1 ring-black/5 p-4 relative group">
                <p :class="['text-xs uppercase tracking-[0.22em] font-medium', th.subText]">
                  Regal seleccionat
                </p>
                <div class="flex items-start justify-between gap-2 mt-2">
                  <p :class="['text-lg font-bold leading-tight', th.inverseText]">
                    {{ selectedGift?.name || 'Encara no n’has triat cap' }}
                  </p>
                  <UButton v-if="selectedGift" color="neutral" variant="ghost" icon="i-lucide-x" size="xs"
                    class="rounded-full -mt-1 -mr-1 hover:bg-black/10" @click="selectedGiftId = null"
                    title="Treure selecció" />
                </div>
                <p :class="['mt-2 text-sm leading-6', th.subText]">
                  <span v-if="selectedGift">{{ selectedGift.description }}</span>
                  <span v-else>Selecciona un regal disponible de la llista per a completar la reserva.</span>
                </p>
              </div>

              <div v-if="feedback" class="rounded-[1.5rem] p-4 text-sm" :class="feedback.tone === 'success'
                ? 'bg-emerald-400/10 text-emerald-800 ring-1 ring-emerald-400/20'
                : feedback.tone === 'error'
                  ? 'bg-red-400/10 text-red-800 ring-1 ring-red-400/20'
                  : 'bg-black/5 text-slate-800 ring-1 ring-black/10'">
                {{ feedback.text }}
              </div>

              <div class="space-y-4">
                <div>
                  <label :class="['mb-2 block text-sm font-medium', th.inverseText]">El teu nom</label>
                  <UInput v-model="guestName" size="xl" :color="th.inputColor as any" variant="outline"
                    placeholder="Ex. Maria i Joan" class="w-full" />
                </div>

                <div>
                  <label :class="['mb-2 block text-sm font-medium', th.inverseText]">Missatge opcional</label>
                  <UTextarea v-model="guestMessage" :rows="4" :color="th.inputColor as any" variant="outline"
                    placeholder="Ex. Moltes ganes d’acompanyar-vos en aquest dia." class="w-full" />
                </div>
              </div>

              <UButton block size="xl" :color="th.btnPrimary as any" icon="i-lucide-check" :loading="isSubmitting"
                @click="handleReserveGift">
                Reservar regal
              </UButton>
            </div>
          </UCard>
        </div>
      </section>
    </div>
  </div>
</template>
