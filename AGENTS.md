# AGENTS.md

## Resum del projecte

Aquest repositori conté una web app feta amb `Nuxt 4` per a una **landing de primera comunió**. El producte actual està centrat en un únic flux:

- mostrar la informació de l'esdeveniment
- mostrar una llista de regals
- permetre reservar un regal

No hi ha backend custom. La persistència es resol amb `Supabase` directament des del frontend.

## Stack actual

- `Nuxt 4`
- `Vue 3`
- `@nuxt/ui` 4
- `Tailwind CSS` 4
- `TypeScript`
- `@supabase/supabase-js`
- `pnpm`

## Fitxers clau

- [app/pages/index.vue](/Users/josep/dev/comunio-app/app/pages/index.vue)
  Landing principal i flux de reserva.

- [app/composables/useGiftRegistry.ts](/Users/josep/dev/comunio-app/app/composables/useGiftRegistry.ts)
  Lògica de lectura/reserva de regals i mode demo.

- [app/app.vue](/Users/josep/dev/comunio-app/app/app.vue)
  Shell global simplificat.

- [nuxt.config.ts](/Users/josep/dev/comunio-app/nuxt.config.ts)
  Configuració Nuxt i `runtimeConfig.public` per a Supabase.

- [.env.example](/Users/josep/dev/comunio-app/.env.example)
  Variables d'entorn públiques esperades.

- [README.md](/Users/josep/dev/comunio-app/README.md)
  Setup i esquema SQL mínim.

## Variables d'entorn

```bash
NUXT_PUBLIC_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
```

Si falten, el projecte usa dades demo en memòria.

## Model de dades

La UI actual espera dues taules a `public`:

1.  **event_settings**: `id`, `child_name`, `event_date`, `ceremony_location`, `ceremony_url`, `restaurant_location`, `restaurant_url`, `contact_parents`, `contact_phone`, `theme`, `logo_url`.
2.  **gifts**: `id`, `name`, `description`, `price`, `image_url`, `purchase_options` (JSONB), `assigned_to`, `guest_message`, `assigned_at`, `created_at`.

La reserva es fa amb una actualització condicionada:

```ts
.eq('id', giftId).is('assigned_to', null)
```

## Convencions útils

- El panell d'admin està a `/admin`.
- En mode demo (sense envs), fes servir `admin@demo.com` / `demo123`.
- El package manager de referència és `pnpm`.
- Si toques la lògica de regals, mantín també el mode demo.
- Si canvies l'esquema de dades, actualitza `README.md` i `AGENTS.md`.
- Abans de tancar canvis, comprova:

```bash
pnpm typecheck
pnpm build
```

## Nota sobre Nuxt UI

La shell actual no usa `UApp`. En aquest repo es va detectar un error de runtime de `ConfigProvider`/`reka-ui` en dev, així que abans de reintroduir-lo cal validar-ho expressament.

