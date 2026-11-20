# Maison Lia Delivery — Fase 3: Carrito y checkout por WhatsApp

Este paquete **actualiza la Fase 2**. No es un proyecto nuevo.

## 1. Antes de empezar

1. Verificá que la Fase 2 siga funcionando y que Supabase muestre productos activos.
2. Desde VS Code, guardá tus cambios locales mediante un commit o copia de seguridad.
3. Descomprimí el ZIP en la **raíz** de `Maisonlia-Delivery` (donde está `package.json`).
4. Conservá `package.json`, `.env.local`, `.git`, `public/`, `supabase/` y tus imágenes.
5. Permití reemplazar `src/App.jsx`, `src/App.module.css`, `src/components/Header.jsx`,
   `src/components/Header.module.css`, `src/components/Catalog.jsx` y
   `src/components/Catalog.module.css`.
6. Copiá también las **carpetas nuevas** `context/`, `hooks/`, `utils/` y el componente `CartDrawer`.

### Comandos

```bash
npm install
npm run dev
```

Para revisar la compilación:

```bash
npm run build
```

**No hay nuevas dependencias**: seguimos usando React, `lucide-react` y `@supabase/supabase-js`.
**No hay SQL nuevo**: reutilizamos las tablas y RLS de la Fase 2.

## 2. Qué se implementó

- Botón «Agregar» en los productos disponibles.
- Carrito de compras en la cabecera.
- Barra fija de carrito en celulares cuando hay productos.
- Panel lateral en escritorio y pantalla completa en móvil.
- Sumar/restar cantidades, eliminar productos y vaciar el carrito.
- Subtotales por línea y totales separados en USD y CUP (sin conversión).
- Campos **opcionales**: nombre, dirección/referencia y observaciones generales.
- Enlace de WhatsApp con nombre, cantidades, precios, subtotales, totales y observaciones.
- Comprobación del catálogo en Supabase justo antes de abrir WhatsApp.
- Persistencia del carrito en `localStorage`, guardando **únicamente IDs y cantidades**.
- Límite de seguridad del prototipo: 40 productos distintos y 99 unidades de cada uno.

## 3. Mapa de archivos

```text
src/
├── App.jsx                       # Composición de la página y proveedor del carrito
├── App.module.css                # Estilos de la página
├── components/
│   ├── Catalog.jsx              # Listado + botón Agregar
│   ├── Catalog.module.css
│   ├── Header.jsx               # Acceso al carrito
│   ├── Header.module.css
│   ├── CartDrawer.jsx           # Resumen, cantidades y checkout
│   └── CartDrawer.module.css
├── context/
│   └── CartContext.jsx          # Estado compartido y localStorage
├── hooks/
│   └── useCatalog.js            # Consulta/recarga del catálogo desde App
├── services/
│   └── catalog.js               # Servicio original; no se modifica
└── utils/
    ├── money.js                 # Precios, centavos y monedas
    └── order.js                 # Mensaje y detección de cambios

tests/
└── cart-logic.test.js           # Pruebas de lógica sin dependencias extra
```

## 4. Flujo del pedido

1. `App.jsx` llama `useCatalog()` para recibir productos desde Supabase.
2. `CartProvider` proporciona el mismo carrito a la cabecera, al catálogo y al panel.
3. `Catalog.jsx` utiliza `addItem(product.id)` para añadir el producto.
4. El carrito solo persiste `{ productId, quantity }` en el navegador.
5. Los precios y las imágenes se leen del catálogo **actual**, no del almacenamiento local.
6. El cliente revisa las cantidades, los totales y añade observaciones opcionales.
7. Al pulsar «Continuar en WhatsApp», se vuelve a consultar Supabase.
8. Si algún producto cambió de nombre, precio o disponibilidad, se detiene el envío y se actualiza la vista para que el usuario revise de nuevo.
9. Si todo sigue igual, se construye el mensaje y la pestaña navega a `wa.me/5354054978?text=...`.
10. El cliente **debe pulsar Enviar dentro de WhatsApp**. No se confirma ni registra automáticamente ningún pedido.

## 5. Ejemplo de mensaje

```text
*Pedido para Maison Lia*

*Productos:*
1. Hamburguesa clásica
   2 × USD 5,50 = USD 11,00
2. Refresco
   1 × CUP 150,25 = CUP 150,25

*Total de productos:*
USD 11,00
CUP 150,25

*Entrega:* A coordinar por WhatsApp
*Nombre:* Ana

*Observaciones:* Sin cebolla

Los precios y la disponibilidad están sujetos a confirmación del negocio.
El costo de envío se coordina por este medio.
```

## 6. Pruebas recomendadas

- Añadir dos productos del mismo tipo; confirmar que la cantidad se incrementa.
- Añadir un producto USD y uno CUP; se deben ver **dos totales**.
- Sumar, restar y eliminar productos desde el panel.
- Recargar la página; el carrito debe mantenerse.
- Cerrar y volver a abrir el carrito; comprobar que sigue allí.
- Cambiar `products.is_available` a `false` en Supabase y actualizar la página.
  El producto debe quedar bloqueado en el carrito hasta eliminarlo.
- Cambiar el precio en Supabase mientras el carrito está abierto y pulsar
  «Continuar en WhatsApp». La aplicación debe **detenerse** para que revises el nuevo precio.
- Escribir «Sin cebolla» en observaciones y verificar que aparezca en WhatsApp.
- Comprobar el diseño a 320 px, 375 px, 768 px y escritorio.

### Prueba de utilidades con Node.js

```bash
node --experimental-default-type=module --test tests/cart-logic.test.js
```

### Compilación y push

```bash
npm run build

git add .
git commit -m "feat: carrito y checkout por WhatsApp"
git push origin main
```

## 7. Límites y seguridad (importante)

- **No hay pasarela de pago, backend de órdenes ni panel de pedidos.**
- La web **no sabe si el cliente finalmente envió el mensaje**, y no borra automáticamente el carrito.
- Los importes son orientativos. El negocio debe confirmar disponibilidad y precio final.
- El frontend comprueba los datos del catálogo, pero los clientes pueden alterar un mensaje
  manualmente. El comercio **no debe tratar el texto de WhatsApp como un pedido pagado o verificado**.
- No guardamos nombre, dirección ni observaciones en Supabase ni en `localStorage`.
  Se introducen en el formulario y se incluyen en el texto enviado a WhatsApp.
- No hacemos conversiones entre USD y CUP.
- No hay control automático de horarios: el negocio confirmará pedidos en su horario.
- Si el catálogo cambia justo después de la última consulta, todavía puede existir una diferencia;
  la confirmación del comercio es siempre definitiva.
- Evitá usar el botón de WhatsApp con el número de desarrollo para tomar pedidos reales hasta
  que se sustituya en `src/config/store.js`.
