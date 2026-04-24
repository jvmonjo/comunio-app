<template>
  <UApp>
    <div class="min-h-[100dvh] font-sans antialiased selection:bg-amber-200 selection:text-amber-950 flex flex-col">
      <div class="flex-1">
        <NuxtPage />
      </div>
      <footer class="p-4 text-center text-[10px] text-gray-400/50 font-light">
        <p>
          © {{ new Date().getFullYear() }} — Fet amb ♡ per <a href="https://github.com/jvmonjo/comunio-app"
            target="_blank" class="hover:text-gray-400 transition-colors duration-300 ml-1">Josep</a>
          <NuxtLink to="/admin" class="hover:text-gray-400 transition-colors duration-300 ml-1">·</NuxtLink>
        </p>
      </footer>
    </div>
  </UApp>
</template>
