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

## Esquema SQL mínim

```sql
create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price numeric(10, 2),
  icon text,
  assigned_to text,
  guest_message text,
  assigned_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.gifts enable row level security;

create policy "public read gifts"
on public.gifts
for select
using (true);

create policy "reserve free gift"
on public.gifts
for update
using (assigned_to is null)
with check (
  assigned_to is not null
  and char_length(assigned_to) > 1
);
```

## Dades de prova

```sql
insert into public.gifts (name, description, price, icon)
values
  ('Bicicleta', 'Una bici per a eixir els caps de setmana.', 185, 'i-lucide-bike'),
  ('Lego gran', 'Set creatiu per a construir i jugar en família.', 79, 'i-lucide-blocks'),
  ('Rellotge', 'Un detall especial per al dia de la comunio.', 120, 'i-lucide-watch'),
  ('Llibres d''aventures', 'Pack de lectures per a l''estiu.', 45, 'i-lucide-book-open');
```

## Reserva concurrent

La reserva es fa amb un `update` condicionat:

```ts
.eq('id', giftId).is('assigned_to', null)
```

Si una altra persona l'ha reservat abans, no s'actualitza cap fila i la UI mostra error.
