-- =============================================================================
-- Masrouf — schéma Supabase (tables, sécurité RLS, stockage des factures)
-- À exécuter dans l'éditeur SQL de votre projet Supabase (Database > SQL Editor).
-- Idempotent : peut être relancé sans erreur si les objets existent déjà.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Table des dépenses
-- -----------------------------------------------------------------------------
create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  amount        numeric(10, 3) not null check (amount > 0),
  category      text not null check (
                  category in (
                    'alimentation', 'transport', 'logement', 'shopping',
                    'loisirs', 'sante', 'education', 'autre'
                  )
                ),
  description   text not null default '',
  expense_date  date not null default current_date,
  source        text not null default 'manuel' check (source in ('vocal', 'manuel')),
  raw_text      text,
  receipt_url   text,
  confidence    numeric(3, 2) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  created_at    timestamptz not null default now()
);

create index if not exists expenses_user_date_idx on public.expenses (user_id, expense_date desc);
create index if not exists expenses_user_category_idx on public.expenses (user_id, category);

alter table public.expenses enable row level security;

drop policy if exists "expenses_select_own" on public.expenses;
create policy "expenses_select_own" on public.expenses
  for select using (auth.uid() = user_id);

drop policy if exists "expenses_insert_own" on public.expenses;
create policy "expenses_insert_own" on public.expenses
  for insert with check (auth.uid() = user_id);

drop policy if exists "expenses_update_own" on public.expenses;
create policy "expenses_update_own" on public.expenses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "expenses_delete_own" on public.expenses;
create policy "expenses_delete_own" on public.expenses
  for delete using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Table des budgets (par période et, optionnellement, par catégorie)
-- -----------------------------------------------------------------------------
create table if not exists public.budgets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  period          text not null check (period in ('jour', 'semaine', 'mois')),
  category        text check (
                    category is null or category in (
                      'alimentation', 'transport', 'logement', 'shopping',
                      'loisirs', 'sante', 'education', 'autre'
                    )
                  ),
  limit_amount    numeric(10, 3) not null check (limit_amount > 0),
  alert_threshold numeric(3, 2) not null default 0.8 check (alert_threshold > 0 and alert_threshold <= 1),
  created_at      timestamptz not null default now()
);

-- Un seul budget par utilisateur/période/catégorie (catégorie nulle = budget global)
create unique index if not exists budgets_unique_scope
  on public.budgets (user_id, period, coalesce(category, 'GLOBAL'));

alter table public.budgets enable row level security;

drop policy if exists "budgets_select_own" on public.budgets;
create policy "budgets_select_own" on public.budgets
  for select using (auth.uid() = user_id);

drop policy if exists "budgets_insert_own" on public.budgets;
create policy "budgets_insert_own" on public.budgets
  for insert with check (auth.uid() = user_id);

drop policy if exists "budgets_update_own" on public.budgets;
create policy "budgets_update_own" on public.budgets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "budgets_delete_own" on public.budgets;
create policy "budgets_delete_own" on public.budgets
  for delete using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Abonnements aux notifications push (Web Push / VAPID)
-- -----------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Stockage des photos de factures (bucket privé, un dossier par utilisateur)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

drop policy if exists "receipts_select_own" on storage.objects;
create policy "receipts_select_own" on storage.objects
  for select using (
    bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "receipts_insert_own" on storage.objects;
create policy "receipts_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "receipts_delete_own" on storage.objects;
create policy "receipts_delete_own" on storage.objects
  for delete using (
    bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
  );
