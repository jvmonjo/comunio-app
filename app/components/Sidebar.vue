<script setup>
const links = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/' },
  { label: 'Nueva Factura', icon: 'i-lucide-plus-circle', to: '/new' },
  { label: 'Configuración', icon: 'i-lucide-settings', to: '/settings' }
]
</script>

<template>
  <div class="h-full w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col p-4 shadow-xl z-20">
    <div class="flex items-center gap-3 mb-10 px-2 mt-4">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-green-500/30">
        <UIcon name="i-lucide-percent" class="w-6 h-6" />
      </div>
      <div>
        <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-400">
          SplitInvoice
        </h1>
        <p class="text-xs text-slate-500 font-medium">Gestión de Gastos</p>
      </div>
    </div>
    
    <div class="space-y-2">
      <UButton
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :icon="link.icon"
        block
        class="justify-start transition-all duration-200"
        :variant="$route.path === link.to ? 'solid' : 'ghost'"
        :color="$route.path === link.to ? 'green' : 'gray'"
        :ui="{ rounded: 'rounded-lg', padding: { sm: 'py-2.5 px-3' } }"
      >
        {{ link.label }}
      </UButton>
    </div>
    
    <div class="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-900/50">
         <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
             <UIcon name="i-lucide-user" class="w-4 h-4 text-slate-500" />
         </div>
         <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">Usuario</p>
            <p class="text-xs text-slate-500 truncate">Pro Version</p>
         </div>
      </div>
    </div>
  </div>
</template>
