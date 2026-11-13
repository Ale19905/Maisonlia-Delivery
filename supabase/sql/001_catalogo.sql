-- MAISON LIA | Fase 2
-- Ejecutar una vez en Supabase > SQL Editor.
-- Se crean tablas, índices y políticas de lectura pública.
-- Importante: este script no crea cuentas administrativas.

-- 1. Categorías del menú.
create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    description text,
    sort_order integer not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),

    constraint categories_name_not_empty check (length(trim(name)) > 0),
    constraint categories_slug_not_empty check (length(trim(slug)) > 0)
);

-- 2. Productos (cada variante es un producto independiente).
create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    category_id uuid not null references public.categories(id) on delete restrict,
    name text not null,
    slug text not null unique,
    description text,
    price numeric(12, 2) not null check (price >= 0),
    currency text not null default 'USD' check (currency in ('USD', 'CUP')),
    is_active boolean not null default true,
    is_available boolean not null default true,
    is_featured boolean not null default false,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint products_name_not_empty check (length(trim(name)) > 0),
    constraint products_slug_not_empty check (length(trim(slug)) > 0)
);

-- 3. Rutas de imágenes dentro del bucket "product-images".
create table if not exists public.product_images (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references public.products(id) on delete cascade,
    storage_path text not null,
    alt_text text,
    is_primary boolean not null default false,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),

    constraint images_path_not_empty check (length(trim(storage_path)) > 0),
    constraint unique_image_per_product unique (product_id, storage_path)
);

-- Como máximo una imagen principal por producto.
create unique index if not exists product_images_one_primary_idx
    on public.product_images (product_id)
    where is_primary = true;

-- 4. Configuración básica del negocio.
-- Por ahora el frontend conserva estos valores en src/config/store.js.
-- Se usarán desde la base de datos al crear el panel de configuración.
create table if not exists public.store_settings (
    id smallint primary key default 1 check (id = 1),
    business_name text not null default 'Maison Lia',
    whatsapp_number text not null default '5354054978',
    default_currency text not null default 'USD'
        check (default_currency in ('USD', 'CUP')),
    weekday_open time not null default '10:00',
    weekday_close time not null default '22:00',
    sunday_open time not null default '10:00',
    sunday_close time not null default '20:00',
    updated_at timestamptz not null default now()
);

insert into public.store_settings (id)
values (1)
on conflict (id) do nothing;

-- Índices para agilizar el listado del catálogo.
create index if not exists categories_public_order_idx
    on public.categories (is_active, sort_order);

create index if not exists products_public_order_idx
    on public.products (is_active, category_id, sort_order);

create index if not exists product_images_product_order_idx
    on public.product_images (product_id, sort_order);

-- Mantener la fecha de última modificación de productos.
create or replace function public.set_product_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;

create trigger products_set_updated_at
    before update on public.products
    for each row
    execute function public.set_product_updated_at();

-- 5. Habilitar Row Level Security en las cuatro tablas.
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.store_settings enable row level security;

-- La web pública solo podrá hacer SELECT. No se conceden INSERT/UPDATE/DELETE.
revoke all on table
    public.categories,
    public.products,
    public.product_images,
    public.store_settings
from anon, authenticated;

grant select on table
    public.categories,
    public.products,
    public.product_images,
    public.store_settings
to anon, authenticated;

-- Quitar políticas homónimas si volvés a ejecutar el script.
drop policy if exists "public_read_active_categories" on public.categories;
drop policy if exists "public_read_active_products" on public.products;
drop policy if exists "public_read_active_images" on public.product_images;
drop policy if exists "public_read_store_settings" on public.store_settings;

create policy "public_read_active_categories"
on public.categories
for select
to anon, authenticated
using (is_active = true);

-- Los productos ocultos y los de categorías ocultas no serán visibles.
create policy "public_read_active_products"
on public.products
for select
to anon, authenticated
using (
    is_active = true
    and exists (
        select 1
        from public.categories as c
        where c.id = products.category_id
          and c.is_active = true
    )
);

-- Una imagen solo se muestra si su producto es público.
create policy "public_read_active_images"
on public.product_images
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.products as p
        join public.categories as c on c.id = p.category_id
        where p.id = product_images.product_id
          and p.is_active = true
          and c.is_active = true
    )
);

create policy "public_read_store_settings"
on public.store_settings
for select
to anon, authenticated
using (id = 1);
