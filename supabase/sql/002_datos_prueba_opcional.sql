-- OPCIONAL | Solo para verificar que el catálogo carga datos.
-- Estos registros son ficticios. Eliminarlos antes de publicar el menú real.

insert into public.categories (name, slug, description, sort_order)
values (
    'Papitas fritas',
    'papitas-fritas',
    'Papitas fritas simples, con salsa',
    1
)
on conflict (slug) do nothing;

insert into public.products (
    category_id,
    name,
    slug,
    description,
    price,
    currency,
    sort_order
)
select
    c.id,
    'Papitas fritas',
    'papitas-fritas',
    'Papitas fritas simples, con salsa',
    1.50,
    'USD',
    1
from public.categories as c
where c.slug = 'papitas-fritas'
on conflict (slug) do nothing;
