<template>
  <div class="p-8 max-w-4xl mx-auto space-y-8 font-sans">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
        Panell d'Administració
      </h1>
      <NuxtLink to="/" class="text-indigo-600 hover:text-indigo-800 text-sm font-semibold">
        &larr; Tornar a la web
      </NuxtLink>
    </div>
    
    <div v-if="!auth.user.value" class="max-w-md mx-auto">
      <div class="bg-white/50 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-gray-100">
        <h2 class="text-xl font-bold mb-6 text-gray-800 text-center">Inicia Sessió</h2>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input v-model="email" type="email" class="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contrasenya</label>
            <input v-model="password" type="password" class="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" required />
          </div>
          <button type="submit" :disabled="loading" class="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium rounded-lg transition-colors shadow-md disabled:opacity-70 mt-4">
            {{ loading ? 'Entrant...' : 'Entrar' }}
          </button>
          <p v-if="error" class="text-red-500 text-sm mt-4 text-center bg-red-50 p-2 rounded">{{ error }}</p>
        </form>
      </div>
    </div>

    <div v-else class="space-y-8">
      <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <p class="text-gray-600">Connectat com: <span class="font-semibold text-gray-900">{{ auth.user.value.email }}</span></p>
        <button @click="handleLogout" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors">
          Tancar Sessió
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 class="text-lg font-bold mb-4 text-gray-800">Afegir Nou Regal</h3>
        <form @submit.prevent="handleCreate" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input v-model="newGift.name" required class="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Preu (€)</label>
            <input v-model.number="newGift.price" type="number" step="0.01" class="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Icona (ex: i-lucide-gift)</label>
            <input v-model="newGift.icon" class="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripció</label>
            <textarea v-model="newGift.description" required rows="2" class="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-indigo-500"></textarea>
          </div>
          <div class="md:col-span-2 mt-2">
            <button type="submit" :disabled="creating" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors w-full md:w-auto">
              {{ creating ? 'Creant...' : 'Crear Regal' }}
            </button>
          </div>
        </form>
      </div>

      <div class="space-y-4">
        <h3 class="text-xl font-bold text-gray-800 mb-4">Llista de Regals</h3>
        
        <div v-if="giftsLoading" class="text-center py-8 text-gray-500">
          Carregant regals...
        </div>
        
        <div v-else-if="gifts.length === 0" class="text-center py-8 bg-gray-50 rounded-xl text-gray-500 border border-dashed border-gray-300">
          No hi ha cap regal creat encara.
        </div>
        
        <div v-for="gift in gifts" :key="gift.id" class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span v-if="gift.icon" :class="gift.icon + ' w-5 h-5 text-indigo-500 flex-shrink-0'"></span>
              <h4 class="font-bold text-lg text-gray-900">{{ gift.name }}</h4>
              <span v-if="gift.price" class="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full font-bold">
                {{ gift.price }} €
              </span>
            </div>
            <p class="text-sm text-gray-600 mb-3">{{ gift.description }}</p>
            
            <div class="bg-gray-50 p-3 rounded-lg flex items-start gap-3">
              <div v-if="gift.assigned_to" class="text-sm w-full">
                <p class="text-green-700 font-medium flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-green-500"></span>
                  Reservat per: <span class="font-bold">{{ gift.assigned_to }}</span>
                </p>
                <p v-if="gift.guest_message" class="text-gray-600 italic mt-2 text-sm px-3 py-2 bg-white rounded border border-gray-200">
                  "{{ gift.guest_message }}"
                </p>
                <p class="text-gray-400 text-xs mt-2 font-mono">{{ new Date(gift.assigned_at).toLocaleString() }}</p>
              </div>
              <div v-else class="text-sm text-amber-600 font-medium flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                Lliure / Disponible
              </div>
            </div>
          </div>
          
          <div class="flex flex-row md:flex-col justify-end gap-2 shrink-0">
            <button v-if="gift.assigned_to" @click="handleUnassign(gift.id)" class="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200">
              Alliberar
            </button>
            <button @click="handleDelete(gift.id)" class="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200">
              Esborrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

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
const newGift = ref({ name: '', description: '', price: undefined, icon: 'i-lucide-gift' })

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
