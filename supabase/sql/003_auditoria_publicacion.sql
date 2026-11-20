-- Maison Lia | Fase 5 | AUDITORIA DE SOLO LECTURA
-- Ejecutar en Supabase > SQL Editor.
-- No modifica tablas, politicas, permisos ni datos.
--
-- RESULTADO ESPERADO:
--   rls_activa = true para las cuatro tablas;
--   anon_puede_leer = true;
--   anon_puede_escribir = false;
--   authenticated_puede_escribir = false (aun no tenemos panel custom).

select
    c.relname as tabla,
    c.relrowsecurity as rls_activa,
    has_table_privilege('anon', c.oid, 'SELECT') as anon_puede_leer,
    (
        has_table_privilege('anon', c.oid, 'INSERT') or
        has_table_privilege('anon', c.oid, 'UPDATE') or
        has_table_privilege('anon', c.oid, 'DELETE')
    ) as anon_puede_escribir,
    (
        has_table_privilege('authenticated', c.oid, 'INSERT') or
        has_table_privilege('authenticated', c.oid, 'UPDATE') or
        has_table_privilege('authenticated', c.oid, 'DELETE')
    ) as authenticated_puede_escribir
from pg_class as c
join pg_namespace as n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
      'categories',
      'products',
      'product_images',
      'store_settings'
  )
  and c.relkind in ('r', 'p')
order by c.relname;

-- Revisar las politicas de acceso aplicadas a las tablas.
select
    tablename,
    policyname,
    roles,
    cmd,
    qual,
    with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
      'categories',
      'products',
      'product_images',
      'store_settings'
  )
order by tablename, policyname;

-- El bucket de fotos debe existir y ser publico para servir sus imagenes.
-- Tenerlo publico NO autoriza por si solo las subidas de visitantes.
select
    id,
    public,
    file_size_limit,
    allowed_mime_types
from storage.buckets
where id = 'product-images';

-- Inspeccionar los permisos de Storage. No debe existir una politica
-- que permita INSERT/UPDATE/DELETE anonimo en el bucket product-images.
select
    policyname,
    roles,
    cmd,
    qual,
    with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;
