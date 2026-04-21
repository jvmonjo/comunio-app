# Communion Landing MVP

Landing page feta amb `Nuxt 4`, `Nuxt UI 4` i `Supabase` per a una primera comunio. El repositori està ara centrat només en aquest producte.

Inclou:

- informació bàsica de l'esdeveniment
- compte enrere fins al dia
- llista de regals
- reserva d'un regal per convidat
- mode demo si encara no has configurat `Supabase`

## Stack

- `Nuxt 4`
- `@nuxt/ui` 4
- `@supabase/supabase-js`
- `Tailwind CSS` 4
- `TypeScript`

## Posada en marxa

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Variables d'entorn

```bash
NUXT_PUBLIC_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
```

Si no les poses, la web funciona en mode demo amb dades en memòria.

## Panell d'Administració

Pots gestionar els regals i la configuració de la web des de `/admin`.

**Credencials en mode demo:**
- **Email:** `admin@demo.com`
- **Password:** `demo123`

## Esquema SQL complet

Cal tindre aquestes dues taules a `public` de Supabase:

### 1. Configuració de l'Esdeveniment
```sql
create table public.event_settings (
  id bigint primary key default 1,
  child_name text not null,
  event_date timestamptz not null,
  ceremony_location text,
  ceremony_url text,
  restaurant_location text,
  restaurant_url text,
  contact_parents text,
  contact_phone text,
  theme text default 'amber',
  logo_url text,
  created_at timestamptz default now()
);

-- Insert inicial obligatori (id 1)
insert into public.event_settings (id, child_name, event_date)
values (1, 'Marc', '2026-05-17T12:00:00+00:00');
```

### 2. Llista de Regals
```sql
create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price numeric(10, 2),
  image_url text,
  purchase_options jsonb default '[]'::jsonb,
  assigned_to text,
  guest_message text,
  assigned_at timestamptz,
  created_at timestamptz not null default now()
);
```

## Seguretat (RLS)

```sql
alter table public.gifts enable row level security;
alter table public.event_settings enable row level security;

-- Polítiques lectura pública
create policy "public read gifts" on public.gifts for select using (true);
create policy "public read settings" on public.event_settings for select using (true);

-- Reserva per convidat
create policy "reserve free gift"
on public.gifts for update
using (assigned_to is null)
with check (assigned_to is not null);
```

## Dades de prova (Regals)

```sql
insert into public.gifts (name, description, price, image_url, purchase_options)
values
  ('Bicicleta', 'Bici per a noves aventures.', 185, 'https://images.unsplash.com/photo-1485965120184-e220f721d03e', '[{"store_name": "Decathlon", "price": 185, "link": "https://decathlon.es"}]'),
  ('Lego gran', 'Set creatiu en família.', 79, 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60', '[{"store_name": "Amazon", "price": 75}]');
```

## Reserva concurrent

La reserva es fa amb un `update` condicionat:

```ts
.eq('id', giftId).is('assigned_to', null)
```

Si una altra persona l'ha reservat abans, no s'actualitza cap fila i la UI mostra error.

## Notificacions per correu

El sistema envia correus automàtics quan:
- Un admin afig un nou regal (notifica a la resta d'admins).
- Un convidat reserva un regal (notifica a tots els admins).

### Configuració de Resend
1. Crea un compte a [Resend](https://resend.com).
2. Afig la clau API com a secret a Supabase:
   ```bash
   npx supabase secrets set RESEND_API_KEY=re_your_key
   ```
3. (Opcional) Configura `RESEND_FROM_EMAIL` i `SITE_URL` si vols personalitzar el remitent i els links.

### Configurar Webhook (Manual)
Si estàs en self-hosted, has de crear el webhook manualment (o via SQL) per a que la taula `gifts` cride a la funció:

```sql
-- Exemple de SQL per crear el webhook directament
create trigger "gift_notifications_webhook"
after insert or update on "public"."gifts"
for each row execute function "supabase_functions"."http_request"(
  'http://localhost:54321/functions/v1/handle-gift-notification',
  'POST',
  '{"Content-Type":"application/json", "Authorization": "Bearer LA_TEUA_SERVICE_ROLE_KEY"}',
  '{}',
  '1000'
);
```

## Deploy de Edge Functions (Self-hosted)

Hem inclòs un script de Node.js per fer deploy de les funcions al teu servidor via SFTP.

### Requisits
- Accés SSH per clau al servidor (el script buscarà la clau per defecte a `~/.ssh`).
- Les dependències de desenvolupament instal·lades (`pnpm install`).

### Com fer el deploy
1. Crea un fitxer `.env.deploy` a l'arrel (no es puja al git):
   ```bash
   DEPLOY_HOST=el-teu-servidor.com
   DEPLOY_USER=root
   DEPLOY_PATH=/ruta/al/volum/de/functions
   ```
2. Executa el script via pnpm:
   ```bash
   pnpm deploy-functions
   ```
