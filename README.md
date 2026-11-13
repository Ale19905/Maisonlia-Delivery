# Maison Lia Delivery — Fase 1

Esta entrega contiene **los archivos que se reemplazan o agregan** luego de crear
un proyecto React con Vite. El proyecto todavía **no** muestra productos reales ni
recibe pedidos desde un carrito; se implementarán en las próximas fases.

## Preparación

```bash
git clone https://github.com/Ale19905/Maisonlia-Delivery.git
cd Maisonlia-Delivery
npm create vite@latest . -- --template react
npm install
npm install @supabase/supabase-js lucide-react
```

Cuando Vite avise que el directorio no está vacío, elegir **Ignore files and continue**.
Copiar los archivos de esta entrega sobre los que creó Vite y conservar
`package.json`, `vite.config.js`, `.git` y `LICENSE`.

Verificar que `.gitignore` contenga `.env.local`.

## Ejecución

```bash
npm run dev
```

Visitar http://localhost:5173.

## Configuración de Supabase

En la raíz, copiar `.env.example` a `.env.local` y completar la URL del proyecto
y la **clave publicable** desde Supabase. No usar claves secretas ni `service_role`.
Esta configuración no es obligatoria para ver la página en la fase 1.

## Pendiente

- Tablas y políticas RLS de Supabase
- Catálogo y almacenamiento de imágenes
- Carrito y resumen de pedido
- Observaciones del pedido
- Botón para enviar orden completa por WhatsApp

Nota: entrega y dirección se acuerdan por WhatsApp. No existe tabla `delivery_zones`.
