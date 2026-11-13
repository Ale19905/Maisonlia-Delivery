# Maison Lia Delivery — Fase 2

## Qué cambia

- Tablas de Supabase: `categories`, `products`, `product_images`, `store_settings`.
- RLS: visitantes solo pueden leer registros publicados; no pueden escribir.
- Catálogo dinámico: tarjetas, fotos, precios USD/CUP, búsqueda y categorías.
- Estados de carga, catálogo vacío, sin coincidencias y error con opción de reintentar.
- Componentes mobile-first con CSS Modules.
- El carrito todavía NO está implementado.

## Instalación

1. Tener instalada y operativa la Fase 1.
2. Copiar estos archivos encima de la carpeta del proyecto existente.
3. Abrir **Supabase Dashboard > SQL Editor > New query**.
4. Copiar el contenido de `supabase/sql/001_catalogo.sql` y ejecutar **Run**.
5. Abrir **Storage > New bucket** y crear `product-images` con visibilidad **Public**.
   - Recomendada restricción MIME: `image/webp`, `image/jpeg`, `image/png`.
   - Recomendada restricción por imagen: 2 MB (óptimo: 100–300 KB).
6. Verificar `.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
   Nunca colocar claves secretas o `service_role` en el frontend.
7. Insertar una categoría y un producto desde **Table Editor**, o ejecutar el script **opcional** `002_datos_prueba_opcional.sql`.
8. `npm install` (si hace falta), `npm run dev`, `npm run build`.

## Cómo agregar una foto

1. Subir la imagen a **Storage > product-images**, por ejemplo `menu/hamburguesa.webp`.
2. En **Table Editor > product_images > Insert row**:
    - `product_id`: copiar el UUID del producto creado.
    - `storage_path`: `menu/hamburguesa.webp` (no introducir la URL completa).
    - `alt_text`: descripción accesible, p. ej., "Hamburguesa clásica".
    - `is_primary`: `true`.
    - `sort_order`: `0`.
3. Actualizar la web. El catálogo elegirá la imagen principal.

## Cómo publicar/ocultar productos

- `categories.is_active`: publica u oculta una categoría entera.
- `products.is_active`: publica u oculta el producto.
- `products.is_available`: muestra "No disponible" sin ocultarlo.
- Cada variante, por ejemplo tacos de pollo y tacos de cerdo, es un producto diferente.
- `price` es `numeric(12,2)`; `currency` es `USD` o `CUP`.
- No se realiza conversión automática entre monedas.

## Seguridad

- La clave publicable está diseñada para clientes web siempre que RLS se aplique correctamente.
- No hay políticas de escritura para `anon` ni `authenticated`; la edición inicial se hace en el Dashboard de Supabase.
- El bucket `product-images` es público: subir solamente fotografías destinadas al catálogo.
- No usar Storage del catálogo para datos privados.
- **Importante:** `store_settings` ya existe en Supabase, pero la cabecera y los horarios siguen leyendo `src/config/store.js`. Conectaremos esa configuración dinámica posteriormente.
- Las imágenes de productos ocultos no se publican desde las tablas, pero sus archivos de un bucket público seguirán siendo accesibles si alguien conoce el enlace. Para retirar una foto, eliminarla también de Storage.

## Git

```bash
npm run dev
npm run build

git add .
git commit -m "feat: catalogo dinamico con Supabase"
git push origin main
```

