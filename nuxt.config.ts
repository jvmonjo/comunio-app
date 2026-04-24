// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      link: [
        { rel: 'icon', type: 'image/x-icon', href: `${process.env.NUXT_APP_BASE_URL || '/'}favicon.ico` }
      ]
    }
  },

  nitro: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/'
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      supabaseUrl: '',
      supabaseAnonKey: ''
    }
  },

  sourcemap: false,

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
