<script setup>
useHead({
  link: [
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap' }
  ]
})

const isOpen = ref(false)
</script>

<template>
  <UApp>
    <div class="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans antialiased selection:bg-green-100 selection:text-green-900 dark:selection:bg-green-900/30 dark:selection:text-green-200">
      <!-- Desktop Sidebar -->
      <div class="hidden md:block">
        <Sidebar />
      </div>

      <!-- Mobile Sidebar -->
      <div class="md:hidden">
        <USlideover v-model="isOpen" side="left" :ui="{ width: 'w-64 max-w-full' }">
          <Sidebar />
        </USlideover>
      </div>

      <div class="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header @open-menu="isOpen = true" />
        
        <main class="flex-1 overflow-y-auto w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 scrollme">
           <NuxtPage />
        </main>
      </div>
    </div>
  </UApp>
</template>

<style>
/* Custom Scrollbar for Webkit */
.scrollme::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.scrollme::-webkit-scrollbar-track {
  background: transparent;
}
.scrollme::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 20px;
}
.scrollme::-webkit-scrollbar-thumb:hover {
  background-color: rgba(107, 114, 128, 0.8);
}
</style>
