<script setup>
defineEmits(['open-menu'])
const colorMode = useColorMode()

const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
})

const route = useRoute()
const pageTitle = computed(() => {
  switch (route.path) {
    case '/': return 'Dashboard'
    case '/new': return 'Nueva Factura'
    case '/settings': return 'Configuración'
    default: return 'SplitInvoice'
  }
})
</script>

<template>
  <header
    class="h-16 px-6 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-all duration-300">
    <div class="flex items-center gap-4">
      <UButton icon="i-lucide-menu" color="gray" variant="ghost" class="md:hidden" @click="$emit('open-menu')" />
      <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
        {{ pageTitle }}
      </h2>
    </div>

    <div class="flex items-center gap-2">
      <ClientOnly>
        <UButton :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'" color="gray" variant="ghost" aria-label="Theme"
          @click="isDark = !isDark" class="rounded-full" />
      </ClientOnly>
      <UButton icon="i-lucide-bell" color="gray" variant="ghost" class="rounded-full" />
    </div>
  </header>
</template>
