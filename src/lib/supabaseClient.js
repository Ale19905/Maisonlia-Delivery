import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Este módulo se utilizará al conectar el catálogo en la Fase 2.
// Las dos variables deben estar configuradas en .env.local.
export const supabase = createClient(supabaseUrl, supabaseKey);
