<script setup lang="ts">
import { ref, onMounted } from 'vue'

const auth = useAdminAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const gifts = ref<any[]>([])
const giftsLoading = ref(false)
const creating = ref(false)
const newGift = ref({ name: '', description: '', price: undefined as number | undefined, icon: 'i-lucide-gift' })

onMounted(async () => {
  if (import.meta.client) {
    const sessionActive = await auth.checkSession()
    if (sessionActive) {
      await fetchGifts()
    }
  }
})

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    const res = await auth.login(email.value, password.value)
    if (res.error) error.value = res.error.message || 'Error en iniciar sessió'
    else await fetchGifts()
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

async function fetchGifts() {
  giftsLoading.value = true
  try {
    const supabase = auth.getClient()
    if(!supabase) return
    const { data } = await supabase.from('gifts').select('*').order('created_at', { ascending: false })
    gifts.value = data || []
  } finally {
    giftsLoading.value = false
  }
}

async function handleCreate() {
  creating.value = true
  try {
    const supabase = auth.getClient()
    if(!supabase) return
    const { error: err } = await supabase.from('gifts').insert([{ ...newGift.value }])
    if (err) throw err
    
    newGift.value = { name: '', description: '', price: undefined, icon: 'i-lucide-gift' }
    await fetchGifts()
  } catch (err: any) {
    alert('Error al crear: ' + err.message)
  } finally {
    creating.value = false
  }
}

async function handleDelete(id: string) {
  if(!confirm('Segur que vols esborrar aquest regal de forma permanent?')) return
  try {
    const supabase = auth.getClient()
    if(!supabase) return
    const { error: err } = await supabase.from('gifts').delete().eq('id', id)
    if (err) throw err
    await fetchGifts()
  } catch (err: any) {
    alert('Error al esborrar: ' + err.message)
  }
}

async function handleUnassign(id: string) {
  if(!confirm('Segur que vols alliberar aquesta reserva i que torni a estar disponible?')) return
  try {
    const supabase = auth.getClient()
    if(!supabase) return
    const { error: err } = await supabase.from('gifts').update({
      assigned_to: null,
      guest_message: null,
      assigned_at: null
    }).eq('id', id)
    
    if (err) throw err
    await fetchGifts()
  } catch (err: any) {
    alert('Error al alliberar: ' + err.message)
  }
}
</script>

<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(251,113,133,0.16),_transparent_28%),linear-gradient(180deg,_#fffaf2_0%,_#fffdf8_45%,_#fff7ed_100%)] text-stone-900">
    <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      
      <header class="mb-8 flex flex-col gap-5 rounded-[2rem] border border-white/70 bg-white/75 px-6 py-5 shadow-[0_24px_80px_-40px_rgba(120,53,15,0.45)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-3">
            <UBadge color="neutral" variant="soft" size="lg" class="rounded-full px-3 py-1">
              Administració
            </UBadge>
          </div>
          <h1 class="text-3xl font-extrabold tracking-tight text-stone-900">
            Gestió de Regals
          </h1>
        </div>
        <div>
          <UButton to="/" variant="subtle" color="neutral" icon="i-lucide-arrow-left">
            Tornar a la web
          </UButton>
        </div>
      </header>
      
      <div v-if="!auth.user.value" class="mx-auto mt-12 max-w-sm">
        <UCard class="rounded-[2rem] border-0 bg-white/80 shadow-[0_24px_80px_-42px_rgba(120,53,15,0.45)] backdrop-blur">
          <div class="mb-6 text-center">
            <h2 class="text-xl font-bold text-stone-900">Inicia Sessió</h2>
            <p class="mt-1 text-sm text-stone-500">Accés restringit per als organitzadors</p>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700">Email</label>
              <UInput v-model="email" type="email" icon="i-lucide-mail" color="neutral" variant="outline" required />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700">Contrasenya</label>
              <UInput v-model="password" type="password" icon="i-lucide-lock" color="neutral" variant="outline" required />
            </div>
            <UButton type="submit" block color="neutral" class="mt-2" :loading="loading">
              Entrar
            </UButton>
            
            <div v-if="error" class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
              {{ error }}
            </div>
          </form>
        </UCard>
      </div>

      <div v-else class="space-y-8">
        
        <div class="flex items-center justify-between rounded-[1.5rem] bg-stone-50 p-4 ring-1 ring-stone-200">
          <div class="flex items-center gap-3 text-stone-700">
            <UIcon name="i-lucide-user" class="h-5 w-5" />
            <span class="text-sm font-medium">{{ auth.user.value.email }}</span>
          </div>
          <UButton color="neutral" variant="subtle" size="sm" @click="handleLogout" icon="i-lucide-log-out">
            Tancar Sessió
          </UButton>
        </div>

        <UCard class="rounded-[2rem] border-0 bg-white/80 shadow-[0_24px_80px_-42px_rgba(120,53,15,0.45)] backdrop-blur">
          <div class="mb-5">
            <p class="text-sm uppercase tracking-[0.28em] text-amber-700">Nou registre</p>
            <h3 class="mt-2 text-xl font-bold text-stone-900">Afegir Regal</h3>
          </div>
          
          <form @submit.prevent="handleCreate" class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700">Nom</label>
              <UInput v-model="newGift.name" color="neutral" placeholder="Ex. Bicicleta" required />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700">Preu (€)</label>
              <UInput v-model.number="newGift.price" type="number" color="neutral" placeholder="Opcional" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-stone-700">Icona (<a href="https://icones.js.org/" target="_blank" class="underline">Lucide</a>)</label>
              <UInput v-model="newGift.icon" color="neutral" placeholder="i-lucide-gift" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-medium text-stone-700">Descripció</label>
              <UTextarea v-model="newGift.description" color="neutral" placeholder="Descriu el regal breument" required :rows="2" />
            </div>
            <div class="mt-2 sm:col-span-2">
              <UButton type="submit" color="primary" icon="i-lucide-plus" :loading="creating">
                Afegir a la llista
              </UButton>
            </div>
          </form>
        </UCard>

        <UCard class="rounded-[2rem] border-0 bg-stone-950 text-stone-50 shadow-[0_28px_90px_-45px_rgba(28,25,23,0.95)]">
          <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
             <div>
                <p class="text-sm uppercase tracking-[0.28em] text-amber-200/70">Inventari</p>
                <h3 class="mt-2 text-2xl font-bold">Tots els regals</h3>
             </div>
             <UButton color="neutral" variant="soft" icon="i-lucide-refresh-cw" @click="fetchGifts" :loading="giftsLoading">
                Actualitzar
             </UButton>
          </div>
          
          <div v-if="gifts.length === 0 && !giftsLoading" class="rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-center text-stone-400">
             Encara no hi ha cap regal.
          </div>

          <div class="grid gap-4">
             <div 
               v-for="gift in gifts" 
               :key="gift.id" 
               class="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-white/10"
             >
                <div class="flex-1">
                  <div class="mb-2 flex items-center gap-3">
                     <div class="rounded-xl bg-white/10 p-2 text-amber-200">
                        <UIcon :name="gift.icon || 'i-lucide-gift'" class="h-5 w-5" />
                     </div>
                     <h4 class="text-lg font-bold text-stone-100">{{ gift.name }}</h4>
                     <UBadge v-if="gift.price" color="neutral" variant="subtle" class="ml-2 rounded-full text-xs">
                        {{ gift.price }} €
                     </UBadge>
                  </div>
                  <p class="mb-3 pl-12 text-sm text-stone-300">{{ gift.description }}</p>

                  <div v-if="gift.assigned_to" class="ml-12 inline-flex flex-col gap-1 rounded-xl bg-amber-500/10 p-3 pr-6 text-sm ring-1 ring-amber-500/20">
                     <span class="font-medium text-amber-200">
                       <UIcon name="i-lucide-user-check" class="mr-1 inline -translate-y-[1px] h-4 w-4" /> 
                       Reservat per: {{ gift.assigned_to }}
                     </span>
                     <span v-if="gift.guest_message" class="mt-1 pl-5 italic text-amber-200/70">"{{ gift.guest_message }}"</span>
                     <span class="mt-1 pl-5 text-xs text-amber-200/50">{{ new Date(gift.assigned_at).toLocaleString() }}</span>
                  </div>
                  <div v-else class="ml-12 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-400 ring-1 ring-emerald-500/20">
                     <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
                     Disponible
                  </div>
                </div>

                <div class="flex shrink-0 gap-2 sm:flex-col items-end">
                   <UButton v-if="gift.assigned_to" color="warning" variant="subtle" size="xs" icon="i-lucide-unlock" @click="handleUnassign(gift.id)">
                      Alliberar
                   </UButton>
                   <UButton color="error" variant="subtle" size="xs" icon="i-lucide-trash-2" @click="handleDelete(gift.id)">
                      Eliminar
                   </UButton>
                </div>
             </div>
          </div>
        </UCard>

      </div>
    </div>
  </div>
</template>
