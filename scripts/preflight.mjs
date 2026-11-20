/**
 * Maison Lia - verificacion previa al despliegue.
 *
 * Ejecutar desde la raiz del proyecto:
 *   node scripts/preflight.mjs
 *   node scripts/preflight.mjs --online
 *   npm run build && node scripts/preflight.mjs --built
 *
 * No imprime el contenido de las claves de Supabase.
 */

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const online = process.argv.includes('--online');
const built = process.argv.includes('--built');
let failures = 0;

function check(condition, description, suggestion) {
    if (condition) {
        console.log(`✓ ${description}`);
        return;
    }

    failures += 1;
    console.error(`✗ ${description}`);
    if (suggestion) {
        console.error(`  → ${suggestion}`);
    }
}

function readLocalEnv() {
    const file = resolve(root, '.env.local');

    if (!existsSync(file)) {
        return {};
    }

    const variables = {};

    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);

        if (!match) {
            continue;
        }

        const [, key, rawValue] = match;
        const value = rawValue.trim();
        variables[key] = value.replace(/^(['"])(.*)\1$/, '$2');
    }

    return variables;
}

function isHttpsUrl(value) {
    try {
        return new URL(value).protocol === 'https:';
    } catch {
        return false;
    }
}

function supportedNodeVersion() {
    const [major, minor] = process.versions.node.split('.').map(Number);
    return (major === 20 && minor >= 19) ||
        (major === 22 && minor >= 12) ||
        major > 22;
}

// Las variables de entorno del proceso prevalecen sobre las de .env.local.
const env = { ...readLocalEnv(), ...process.env };
const supabaseUrl = (env.VITE_SUPABASE_URL || '').trim();
const publishableKey = (env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

console.log('\nMaison Lia — Preflight de publicación\n');

check(supportedNodeVersion(), 'Versión de Node.js compatible con Vite',
    'Usá Node.js 22 LTS actualizado (al menos 22.12).');

check(existsSync(resolve(root, 'package.json')),
    'Se encontró package.json',
    'Ejecutá el comando desde la raíz de Maisonlia-Delivery.');

check(existsSync(resolve(root, 'public', '_headers')),
    'Cabeceras de Cloudflare en public/_headers',
    'Copiá el archivo public/_headers de esta fase.');

check(existsSync(resolve(root, 'public', 'brand', 'maison-lia-logo.webp')),
    'Se encontró el logo provisional',
    'Verificá que exista public/brand/maison-lia-logo.webp.');

check(isHttpsUrl(supabaseUrl),
    'VITE_SUPABASE_URL usa una URL HTTPS válida',
    'Completá VITE_SUPABASE_URL en .env.local con la URL de tu proyecto.');

function isPublicSupabaseKey(key) {
    if (key.startsWith('sb_publishable_')) {
        return true;
    }

    // Compatibilidad solo con el antiguo JWT de rol anon.
    // Un JWT service_role también comienza por 'eyJ', pero NO es público.
    if (key.startsWith('eyJ')) {
        try {
            const payload = JSON.parse(
                Buffer.from(key.split('.')[1], 'base64url').toString('utf8')
            );
            return payload.role === 'anon';
        } catch {
            return false;
        }
    }

    return false;
}

check(isPublicSupabaseKey(publishableKey),
    'Se utiliza una clave publicable de Supabase (nunca secret/service_role)',
    'Configurá VITE_SUPABASE_PUBLISHABLE_KEY con sb_publishable_...');

// Si el archivo fue agregado accidentalmente a Git, no es seguro hacer push.
const trackedEnv = spawnSync('git', ['ls-files', '--error-unmatch', '.env.local'], {
    cwd: root,
    stdio: 'ignore'
});

if (trackedEnv.status === 0) {
    check(false, '.env.local NO está versionado en Git',
        'Ejecutá git rm --cached .env.local y verificá .gitignore antes del push.');
} else {
    console.log('✓ .env.local no figura como archivo versionado en Git');
}

if (built) {
    check(existsSync(resolve(root, 'dist', 'index.html')),
        'Compilación dist/index.html disponible',
        'Ejecutá npm run build antes del preflight --built.');

    check(existsSync(resolve(root, 'dist', '_headers')),
        'Cloudflare recibirá dist/_headers',
        'Repetí npm run build después de agregar public/_headers.');

    check(existsSync(resolve(root, 'dist', 'brand', 'maison-lia-logo.webp')),
        'Logo incluido en la compilación de producción',
        'Revisá la carpeta public/brand.');
}

if (online && failures === 0) {
    console.log('\nComprobando lectura pública de Supabase (solo SELECT)...');

    for (const table of ['categories', 'products']) {
        try {
            const endpoint = new URL(`/rest/v1/${table}`, supabaseUrl);
            endpoint.searchParams.set('select', 'id');
            endpoint.searchParams.set('limit', '1');

            const response = await fetch(endpoint, {
                headers: { apikey: publishableKey },
                signal: AbortSignal.timeout(12000)
            });

            check(response.ok,
                `Lectura pública de ${table}: HTTP ${response.status}`,
                'Revisá el proyecto, las políticas RLS y la conexión a Supabase.');
        } catch (error) {
            check(false, `Lectura pública de ${table}`, error.message);
        }
    }
}

console.log('');

if (failures) {
    console.error(`${failures} comprobación(es) con problemas. No publiques todavía.\n`);
    process.exitCode = 1;
} else {
    console.log('Comprobaciones completadas sin errores detectados.');
    console.log('Esto no sustituye la prueba manual del pedido en el navegador.\n');
}
