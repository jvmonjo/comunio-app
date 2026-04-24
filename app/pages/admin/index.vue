<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const auth = useAdminAuth()
const { settings, fetchSettings, themeClasses: th } = useEventSettings()
const registry = useGiftRegistry()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const gifts = ref<any[]>([])
const giftsLoading = ref(false)
const saving = ref(false)
const settingsSaving = ref(false)
const editingId = ref<string | null>(null)

const localEventDate = computed({
  get() {
    if (!settings.value?.event_date) return ''
    const d = new Date(settings.value.event_date)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  },
  set(val) {
    if (val) settings.value.event_date = new Date(val).toISOString()
  }
})

const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const selectedLogoFile = ref<File | null>(null)
const logoInput = ref<HTMLInputElement | null>(null)

const toast = useToast()

const confirmModal = ref({
  isOpen: false,
  title: '',
  description: '',
  confirmText: 'Confirmar',
  color: 'primary' as 'primary' | 'error' | 'warning',
  action: async () => { }
})
const confirmLoading = ref(false)

function showAlert(title: string, message: string, isError = false) {
  toast.add({
    title,
    description: message,
    color: isError ? 'error' : 'success',
    icon: isError ? 'i-lucide-alert-circle' : 'i-lucide-check-circle'
  })
}

function showConfirm(title: string, description: string, confirmText: string, color: 'primary' | 'error' | 'warning', action: () => Promise<void>) {
  confirmModal.value = { isOpen: true, title, description, confirmText, color, action }
}

async function handleConfirmSubmit() {
  confirmLoading.value = true
  try {
    await confirmModal.value.action()
  } catch (err: any) {
    showAlert('Error', err.message, true)
  } finally {
    confirmLoading.value = false
    confirmModal.value.isOpen = false
  }
}
// --------------------

interface PurchaseOption {
  store_name: string
  price?: number
  link?: string
}

const defaultGift = () => ({
  name: '',
  description: '',
  price: undefined as number | undefined,
  image_url: '',
  is_visible: true,
  purchase_options: [{ store_name: '', price: undefined, link: '' }] as PurchaseOption[]
})

const newGift = ref(defaultGift())

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  selectedFile.value = file || null
}

function onLogoChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  selectedLogoFile.value = file || null
}

function addPurchaseOption() {
  newGift.value.purchase_options.push({ store_name: '', price: undefined, link: '' })
}

function removePurchaseOption(idx: number) {
  newGift.value.purchase_options.splice(idx, 1)
}

function handleEdit(gift: any) {
  editingId.value = gift.id
  newGift.value = {
    name: gift.name,
    description: gift.description,
    price: gift.price || undefined,
    image_url: gift.image_url || '',
    is_visible: gift.is_visible ?? true,
    purchase_options: gift.purchase_options && gift.purchase_options.length > 0
      ? JSON.parse(JSON.stringify(gift.purchase_options))
      : [{ store_name: '', price: undefined, link: '' }]
  }
  if (fileInput.value) fileInput.value.value = ''
  selectedFile.value = null
  document.getElementById('gift-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function cancelEdit() {
  editingId.value = null
  newGift.value = defaultGift()
  if (fileInput.value) fileInput.value.value = ''
  selectedFile.value = null
}

const isReady = ref(false)

onMounted(async () => {
  if (import.meta.client) {
    const sessionActive = await auth.checkSession()
    if (sessionActive || auth.user.value?.id === 'demo-user-id') {
      await fetchSettings()
      await fetchGifts()
    }
  }
  isReady.value = true
})

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    const res = await auth.login(email.value, password.value)
    if (res.error) error.value = res.error.message || 'Error en iniciar sessió'
    else {
      await fetchSettings()
      await fetchGifts()
    }
  } catch (err: any) {
    error.value = err?.message || 'Error desconegut'
  } finally {
    loading.value = false
  }
}

async function handleLogout() {
  await auth.logout()
  gifts.value = []
}

async function handleSaveSettings() {
  settingsSaving.value = true
  try {
    const supabase = auth.getClient()
    
    let finalLogoUrl = settings.value.logo_url

    if (selectedLogoFile.value && supabase) {
      const fileExt = selectedLogoFile.value.name.split('.').pop()
      const fileName = `logo_${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, selectedLogoFile.value)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(fileName)
      finalLogoUrl = publicUrlData.publicUrl
      settings.value.logo_url = finalLogoUrl
    }

    if (!supabase) {
      // In demo mode, the settings are already updated in the state via v-model
      // We just show a success message as it's "persisted" in memory
      if (selectedLogoFile.value) {
        settings.value.logo_url = URL.createObjectURL(selectedLogoFile.value)
      }
      showAlert('Correcte (Demo)', 'Configuració desada en memòria.', false)
      return
    }
    const { error: err } = await supabase.from('event_settings').update({
      child_name: settings.value.child_name,
      event_date: settings.value.event_date,
      ceremony_location: settings.value.ceremony_location,
      ceremony_url: settings.value.ceremony_url,
      restaurant_location: settings.value.restaurant_location,
      restaurant_url: settings.value.restaurant_url,
      contact_parents: settings.value.contact_parents,
      contact_phone: settings.value.contact_phone,
      theme: settings.value.theme,
      logo_url: settings.value.logo_url,
      hide_prices_after_reservation: settings.value.hide_prices_after_reservation
    }).eq('id', 1)
    if (err) throw err
    showAlert('Correcte', 'Configuració de l\'esdeveniment desada amb èxit.', false)
  } catch (e: any) {
    showAlert('Error al guardar', e.message, true)
  } finally {
    settingsSaving.value = false
  }
}

async function fetchGifts() {
  giftsLoading.value = true
  try {
    const supabase = auth.getClient()
    if (!supabase) {
      await registry.fetchGifts()
      gifts.value = registry.gifts.value
      return
    }
    const { data } = await supabase.from('gifts').select('*').order('created_at', { ascending: false })
    gifts.value = data || []
  } finally {
    giftsLoading.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    const supabase = auth.getClient()
    if (!supabase) return

    // Clean up empty purchase options
    const validOptions = newGift.value.purchase_options.filter(o => o.store_name.trim())

    let finalImageUrl = newGift.value.image_url || null

    if (selectedFile.value) {
      const fileExt = selectedFile.value.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('gifts').upload(fileName, selectedFile.value)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('gifts').getPublicUrl(fileName)
      finalImageUrl = publicUrlData.publicUrl
    }

    let err = null

    if (!supabase) {
      // Demo logic
      const giftData: any = {
        name: newGift.value.name,
        description: newGift.value.description,
        price: newGift.value.price || null,
        image_url: finalImageUrl,
        is_visible: newGift.value.is_visible,
        purchase_options: validOptions,
        created_at: new Date().toISOString()
      }

      if (editingId.value) {
        const idx = gifts.value.findIndex(g => g.id === editingId.value)
        if (idx !== -1) {
          gifts.value[idx] = { ...gifts.value[idx], ...giftData }
        }
      } else {
        giftData.id = Math.random().toString(36).substring(7)
        gifts.value = [giftData, ...gifts.value]
      }
      registry.gifts.value = [...gifts.value]
      showAlert('Correcte (Demo)', 'Canvis desats en memòria.', false)
    } else {
      if (editingId.value) {
        const res = await supabase.from('gifts').update({
          name: newGift.value.name,
          description: newGift.value.description,
          price: newGift.value.price || null,
          image_url: finalImageUrl,
          is_visible: newGift.value.is_visible,
          purchase_options: validOptions
        }).eq('id', editingId.value)
        err = res.error
      } else {
        const res = await supabase.from('gifts').insert([{
          name: newGift.value.name,
          description: newGift.value.description,
          price: newGift.value.price || null,
          image_url: finalImageUrl,
          is_visible: newGift.value.is_visible,
          purchase_options: validOptions
        }])
        err = res.error
      }
    }

    if (err) throw err

    cancelEdit()
    await fetchGifts()
  } catch (err: any) {
    showAlert('Error', err.message, true)
  } finally {
    saving.value = false
  }
}

function handleDelete(id: string) {
  showConfirm(
    'Eliminar Regal',
    'Segur que vols esborrar aquest regal de forma permanent?',
    'Eliminar',
    'error',
    async () => {
      const supabase = auth.getClient()
      if (!supabase) {
        gifts.value = gifts.value.filter(g => g.id !== id)
        registry.gifts.value = [...gifts.value]
        showAlert('Eliminat (Demo)', 'Regal esborrat en memòria.', false)
        return
      }
      const { error: err } = await supabase.from('gifts').delete().eq('id', id)
      if (err) throw err
      await fetchGifts()
    }
  )
}

function handleUnassign(id: string) {
  showConfirm(
    'Alliberar Reserva',
    'Segur que vols alliberar aquesta reserva i que torni a estar disponible?',
    'Alliberar',
    'warning',
    async () => {
      const supabase = auth.getClient()
      if (!supabase) {
        const gift = gifts.value.find(g => g.id === id)
        if (gift) {
          gift.assigned_to = null
          gift.guest_message = null
          gift.assigned_at = null
          gifts.value = [...gifts.value]
          registry.gifts.value = [...gifts.value]
          showAlert('Alliberat (Demo)', 'Reserva alliberada en memòria.', false)
        }
        return
      }
      const { error: err } = await supabase.from('gifts').update({
        assigned_to: null,
        guest_message: null,
        assigned_at: null
      }).eq('id', id)
      if (err) throw err
      await fetchGifts()
    }
  )
}
</script>

<template>
  <div
    v-if="!isReady"
    class="flex min-h-[100dvh] items-center justify-center bg-[#fffaf2]"
  >
    <div class="flex flex-col items-center gap-4">
      <UIcon
        name="i-lucide-loader-2"
        class="h-10 w-10 animate-spin text-amber-500"
      />
      <span class="text-sm font-medium tracking-widest text-amber-900/60 uppercase">Carregant Admin...</span>
    </div>
  </div>

  <div
    v-else
    :class="th.bgMain"
  >
    <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header
        class="mb-8 flex flex-col gap-5 rounded-[2rem] border border-white/70 bg-white/75 px-6 py-5 shadow-[0_24px_80px_-40px_rgba(120,53,15,0.45)] backdrop-blur sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div class="mb-2 flex items-center gap-3">
            <UBadge
              color="neutral"
              variant="soft"
              size="lg"
              class="rounded-full px-3 py-1"
            >
              Administració
            </UBadge>
          </div>
          <h1 class="text-3xl font-extrabold tracking-tight text-stone-900">
            Panell General
          </h1>
        </div>
        <div>
          <UButton
            to="/"
            variant="subtle"
            color="neutral"
            icon="i-lucide-arrow-left"
          >
            Tornar a la web
          </UButton>
        </div>
      </header>

      <div
        v-if="!auth.user.value"
        class="mx-auto mt-12 max-w-sm"
      >
        <UCard
          class="rounded-[2rem] border-0 bg-white/80 shadow-[0_24px_80px_-42px_rgba(120,53,15,0.45)] backdrop-blur"
        >
          <div class="mb-6 text-center">
            <h2 class="text-xl font-bold text-stone-900">
              Inicia Sessió
            </h2>
            <p class="mt-1 text-sm text-stone-500">
              Accés restringit per als organitzadors
            </p>
          </div>

          <form
            class="space-y-4"
            @submit.prevent="handleLogin"
          >
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700">Email</label>
              <UInput
                v-model="email"
                type="email"
                icon="i-lucide-mail"
                color="neutral"
                variant="outline"
                required
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700">Contrasenya</label>
              <UInput
                v-model="password"
                type="password"
                icon="i-lucide-lock"
                color="neutral"
                variant="outline"
                required
              />
            </div>
            <UButton
              type="submit"
              block
              color="neutral"
              class="mt-2"
              :loading="loading"
            >
              Entrar
            </UButton>

            <div
              v-if="error"
              class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200"
            >
              {{ error }}
            </div>

            <div
              v-if="!auth.getClient()"
              class="mt-6 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100"
            >
              <p class="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Mode Demo Actiu</p>
              <p class="text-xs text-amber-700 leading-relaxed">
                No s'ha detectat configuració de Supabase. Pots entrar amb:<br>
                <span class="font-mono font-bold">admin@demo.com</span> / <span class="font-mono font-bold">demo123</span>
              </p>
            </div>
          </form>
        </UCard>
      </div>

      <div
        v-else
        class="space-y-8"
      >
        <div class="flex items-center justify-between rounded-[1.5rem] bg-stone-50 p-4 ring-1 ring-stone-200">
          <div class="flex items-center gap-3 text-stone-700">
            <UIcon
              name="i-lucide-user"
              class="h-5 w-5"
            />
            <span class="text-sm font-medium">{{ auth.user.value.email }}</span>
          </div>
          <UButton
            color="neutral"
            variant="subtle"
            size="sm"
            icon="i-lucide-log-out"
            @click="handleLogout"
          >
            Tancar Sessió
          </UButton>
        </div>

        <UCard
          class="rounded-[2rem] border-0 bg-white/80 shadow-[0_24px_80px_-42px_rgba(120,53,15,0.45)] backdrop-blur"
        >
          <div class="mb-5">
            <p class="text-sm uppercase tracking-[0.28em] text-amber-700">
              Dades globals
            </p>
            <h3 class="mt-2 text-xl font-bold text-stone-900">
              Configuració de l'Esdeveniment
            </h3>
          </div>

          <form
            v-if="settings"
            class="grid gap-4 sm:grid-cols-2"
            @submit.prevent="handleSaveSettings"
          >
            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-medium text-stone-700">Logo de la web (Sustitueix el text superior)</label>
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div v-if="settings.logo_url" class="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                  <img :src="settings.logo_url" class="h-full w-full object-contain p-1">
                </div>
                <div v-else class="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 text-stone-400">
                  <UIcon name="i-lucide-image" class="h-6 w-6" />
                </div>
                <div class="flex-1 space-y-2">
                  <input
                    ref="logoInput"
                    type="file"
                    accept="image/svg+xml,image/png,image/jpeg"
                    class="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-colors"
                    @change="onLogoChange"
                  >
                  <p class="text-xs text-stone-500">Formats recomanats: SVG, PNG o JPG amb fons transparent.</p>
                </div>
                <UButton
                  v-if="settings.logo_url"
                  color="error"
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-trash-2"
                  @click="settings.logo_url = ''"
                >
                  Eliminar logo
                </UButton>
              </div>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700">Nom de l'infant</label>
              <UInput
                v-model="settings.child_name"
                color="neutral"
                required
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700">Data i Hora</label>
              <UInput
                v-model="localEventDate"
                type="datetime-local"
                icon="i-lucide-calendar"
                color="neutral"
                required
              />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-medium text-stone-700">Lloc de la cerimònia</label>
              <div class="flex flex-col gap-2 sm:flex-row">
                <UInput
                  v-model="settings.ceremony_location"
                  color="neutral"
                  required
                  placeholder="Ex. Parròquia de Sant Joan"
                  class="flex-1"
                />
                <UInput
                  v-model="settings.ceremony_url"
                  color="neutral"
                  icon="i-lucide-map-pin"
                  placeholder="URL Google Maps (opcional)"
                  class="flex-1"
                />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-medium text-stone-700">Lloc del convit / restaurant</label>
              <div class="flex flex-col gap-2 sm:flex-row">
                <UInput
                  v-model="settings.restaurant_location"
                  color="neutral"
                  required
                  placeholder="Ex. Restaurant El Jardí"
                  class="flex-1"
                />
                <UInput
                  v-model="settings.restaurant_url"
                  color="neutral"
                  icon="i-lucide-map-pin"
                  placeholder="URL Google Maps (opcional)"
                  class="flex-1"
                />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700">Pares / Contacte (ex: Ana i Vicent)</label>
              <UInput
                v-model="settings.contact_parents"
                color="neutral"
                required
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700">Telèfon de contacte</label>
              <UInput
                v-model="settings.contact_phone"
                color="neutral"
                required
              />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-medium text-stone-700">Tonalitat de la web (Tema)</label>
              <USelect
                v-model="settings.theme"
                :items="[{ label: 'Daurat Clàssic (Càlid)', value: 'amber' }, { label: 'Blau Celest (Angèlic)', value: 'blue' }, { label: 'Rosa Empolsat (Suau)', value: 'pink' }]"
                color="neutral"
              />
            </div>
            <div class="sm:col-span-2">
              <UCheckbox
                v-model="settings.hide_prices_after_reservation"
                label="Amagar preus quan un regal ja estiga reservat"
                color="neutral"
              />
            </div>

            <div class="mt-4 sm:col-span-2">
              <UButton
                type="submit"
                size="lg"
                color="primary"
                icon="i-lucide-save"
                :loading="settingsSaving"
              >
                Guardar configuració global
              </UButton>
            </div>
          </form>
        </UCard>

        <UCard
          id="gift-form"
          class="rounded-[2rem] border-0 bg-white/80 shadow-[0_24px_80px_-42px_rgba(120,53,15,0.45)] backdrop-blur transition-all"
          :class="editingId ? 'ring-2 ring-indigo-500 shadow-indigo-500/20' : ''"
        >
          <div class="mb-5 flex justify-between items-center">
            <div>
              <p class="text-sm uppercase tracking-[0.28em] text-amber-700">
                {{ editingId ? 'Edició' : 'Nou registre' }}
              </p>
              <h3 class="mt-2 text-xl font-bold text-stone-900">
                {{ editingId ? 'Editar Regal' : 'Afegir Regal' }}
              </h3>
            </div>
            <UButton
              v-if="editingId"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              @click="cancelEdit"
            />
          </div>

          <form
            class="grid gap-4 sm:grid-cols-2"
            @submit.prevent="handleSave"
          >
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700">Nom</label>
              <UInput
                v-model="newGift.name"
                color="neutral"
                placeholder="Ex. Bicicleta"
                required
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700">Preu estimat (€)</label>
              <UInput
                v-model.number="newGift.price"
                type="number"
                color="neutral"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700">Visibilitat</label>
              <UCheckbox
                v-model="newGift.is_visible"
                label="Producte visible a la llista pública"
                color="neutral"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-medium text-stone-700">Imatge del Regal</label>
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-colors"
                  @change="onFileChange"
                >
                <span class="text-sm font-medium text-stone-400">o via URL directe:</span>
                <UInput
                  v-model="newGift.image_url"
                  color="neutral"
                  placeholder="https://..."
                  class="w-full sm:w-1/2"
                />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-medium text-stone-700">Descripció</label>
              <UTextarea
                v-model="newGift.description"
                color="neutral"
                placeholder="Descriu el regal breument"
                required
                :rows="2"
              />
            </div>

            <div class="sm:col-span-2 mt-4 rounded-[1.5rem] bg-stone-50 p-5 ring-1 ring-stone-200">
              <div class="mb-3 flex items-center justify-between">
                <label class="block text-sm font-bold text-stone-800">Opcions de compra (Tendes)</label>
                <UButton
                  type="button"
                  color="neutral"
                  variant="soft"
                  size="xs"
                  icon="i-lucide-plus"
                  @click="addPurchaseOption"
                >
                  Afegir tenda
                </UButton>
              </div>
              <div class="space-y-3">
                <div
                  v-for="(opt, idx) in newGift.purchase_options"
                  :key="idx"
                  class="flex items-start gap-2 bg-white p-3 rounded-xl border border-stone-100 shadow-sm relative"
                >
                  <div class="grid flex-1 gap-3 sm:grid-cols-3">
                    <UInput
                      v-model="opt.store_name"
                      size="sm"
                      color="neutral"
                      placeholder="Nom botiga (ex: Amazon)"
                    />
                    <UInput
                      v-model.number="opt.price"
                      size="sm"
                      type="number"
                      color="neutral"
                      placeholder="Preu aquí (€)"
                    />
                    <UInput
                      v-model="opt.link"
                      size="sm"
                      color="neutral"
                      placeholder="Enllaç URL botiga"
                    />
                  </div>
                  <UButton
                    type="button"
                    color="error"
                    variant="ghost"
                    size="sm"
                    icon="i-lucide-x"
                    @click="removePurchaseOption(idx)"
                  />
                </div>
              </div>
            </div>

            <div class="mt-4 sm:col-span-2 flex flex-col sm:flex-row gap-3">
              <UButton
                type="submit"
                size="lg"
                color="primary"
                :icon="editingId ? 'i-lucide-save' : 'i-lucide-plus'"
                :loading="saving"
              >
                {{ editingId ? 'Guardar canvis' : 'Crear i afegir a la llista' }}
              </UButton>
              <UButton
                v-if="editingId"
                type="button"
                size="lg"
                color="neutral"
                variant="soft"
                @click="cancelEdit"
              >
                Cancel·lar edició
              </UButton>
            </div>
          </form>
        </UCard>

        <UCard
          class="rounded-[2rem] border-0 bg-stone-950 text-stone-50 shadow-[0_28px_90px_-45px_rgba(28,25,23,0.95)]"
        >
          <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm uppercase tracking-[0.28em] text-amber-200/70">
                Inventari
              </p>
              <h3 class="mt-2 text-2xl font-bold">
                Tots els regals
              </h3>
            </div>
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-refresh-cw"
              :loading="giftsLoading"
              @click="fetchGifts"
            >
              Actualitzar
            </UButton>
          </div>

          <div
            v-if="gifts.length === 0 && !giftsLoading"
            class="rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-center text-stone-400"
          >
            Encara no hi ha cap regal.
          </div>

          <div class="grid gap-4">
            <div
              v-for="gift in gifts"
              :key="gift.id"
              class="flex flex-col gap-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-stone-200 sm:flex-row sm:items-start transition-colors hover:bg-white/10"
            >
              <div class="shrink-0">
                <div
                  v-if="gift.image_url"
                  class="h-20 w-20 overflow-hidden rounded-2xl ring-1 ring-white/20"
                >
                  <img
                    :src="gift.image_url"
                    class="h-full w-full object-cover"
                  >
                </div>
                <div
                  v-else
                  class="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-stone-400"
                >
                  <UIcon
                    name="i-lucide-image"
                    class="h-8 w-8"
                  />
                </div>
              </div>

              <div class="flex-1">
                <div class="mb-2 flex items-center gap-3">
                  <h4 class="text-lg font-bold text-stone-100">
                    {{ gift.name }}
                  </h4>
                  <UBadge
                    v-if="gift.price"
                    color="neutral"
                    variant="subtle"
                    class="rounded-full text-xs"
                  >
                    {{ gift.price }} €
                  </UBadge>
                  <UBadge
                    v-if="!gift.is_visible"
                    color="error"
                    variant="soft"
                    class="rounded-full text-xs"
                    icon="i-lucide-eye-off"
                  >
                    Ocult
                  </UBadge>
                </div>
                <p class="mb-3 text-sm text-stone-400">
                  {{ gift.description }}
                </p>

                <div
                  v-if="gift.purchase_options && gift.purchase_options.length > 0"
                  class="mb-4 text-xs"
                >
                  <p class="font-semibold uppercase tracking-wider text-amber-200/60 mb-2">
                    Tendes sugerides:
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="(opt, i) in gift.purchase_options"
                      :key="i"
                      class="inline-flex items-center gap-1.5 rounded-lg bg-black/30 px-2.5 py-1 text-stone-300 ring-1 ring-white/10"
                    >
                      <UIcon
                        name="i-lucide-shopping-bag"
                        class="h-3 w-3 text-amber-500"
                      />
                      {{ opt.store_name }}
                      <span
                        v-if="opt.price"
                        class="text-stone-400"
                      >({{ opt.price }}€)</span>
                    </span>
                  </div>
                </div>

                <div
                  v-if="gift.assigned_to"
                  class="inline-flex flex-col gap-1 rounded-xl bg-amber-500/10 p-3 pr-6 text-sm ring-1 ring-amber-500/20"
                >
                  <span class="font-medium text-amber-200">
                    <UIcon
                      name="i-lucide-user-check"
                      class="mr-1 inline -translate-y-[1px] h-4 w-4"
                    />
                    Reservat per: {{ gift.assigned_to }}
                  </span>
                  <span
                    v-if="gift.guest_message"
                    class="mt-1 border-l-2 border-amber-500/30 pl-3 italic text-amber-200/70"
                  >"{{ gift.guest_message
                  }}"</span>
                  <span class="mt-1 text-xs text-amber-200/50">{{ new Date(gift.assigned_at).toLocaleString() }}</span>
                </div>
                <div
                  v-else
                  class="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-400 ring-1 ring-emerald-500/20"
                >
                  <span class="h-2 w-2 rounded-full bg-emerald-400" />
                  Disponible
                </div>
              </div>

              <div class="flex shrink-0 gap-2 sm:flex-col items-end">
                <UButton
                  color="neutral"
                  variant="subtle"
                  size="xs"
                  icon="i-lucide-pencil"
                  @click="handleEdit(gift)"
                >
                  Editar
                </UButton>
                <UButton
                  v-if="gift.assigned_to"
                  color="warning"
                  variant="subtle"
                  size="xs"
                  icon="i-lucide-unlock"
                  @click="handleUnassign(gift.id)"
                >
                  Alliberar
                </UButton>
                <UButton
                  color="error"
                  variant="subtle"
                  size="xs"
                  icon="i-lucide-trash-2"
                  @click="handleDelete(gift.id)"
                >
                  Eliminar
                </UButton>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Modals -->
      <UModal
        v-model:open="confirmModal.isOpen"
        :title="confirmModal.title"
        :description="confirmModal.description"
        overlay
      >
        <template #footer>
          <div class="flex justify-end gap-3 w-full">
            <UButton
              color="neutral"
              variant="ghost"
              @click="confirmModal.isOpen = false"
            >
              Cancel·lar
            </UButton>
            <UButton
              :color="confirmModal.color"
              :loading="confirmLoading"
              @click="handleConfirmSubmit"
            >
              {{ confirmModal.confirmText }}
            </UButton>
          </div>
        </template>
      </UModal>
    </div>
  </div>
</template>
