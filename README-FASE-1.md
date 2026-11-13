# Maison Lia Delivery — Fase 1

Este paquete contiene **archivos para reemplazar o agregar** a una aplicación React + Vite creada en el repositorio existente.

## Instalación

```bash
git clone https://github.com/Ale19905/Maisonlia-Delivery.git
cd Maisonlia-Delivery
npm create vite@latest . -- --template react
npm install
npm install @supabase/supabase-js lucide-react
```

Cuando Vite advierta que la carpeta no está vacía, seleccionar **Ignore files and continue** para conservar LICENSE.

Luego, copiar el contenido de este paquete dentro del repositorio, reemplazando los archivos que correspondan.

Crear `.env.local` en la raíz a partir de `.env.example` y completar los valores obtenidos del panel Connect de Supabase. Nunca subir claves secretas o `service_role` al frontend.

```bash
npm run dev
npm run build
```

## Estado

- Encabezado y portada responsive: sí.
- Logo aportado por el usuario: sí.
- Datos horarios y contacto WhatsApp de desarrollo: sí.
- Cliente de Supabase preparado: sí; aún sin tablas ni consultas.
- Catálogo, carrito y checkout: pendientes de las próximas fases.

## Seguridad

No incluir `.env.local` en Git. Asegurarse de que `.gitignore` contiene una línea `.env.local` (o `*.local`).

## Git

```bash
git add .
git commit -m "feat: iniciar web responsive Maison Lia"
git push origin main
```
