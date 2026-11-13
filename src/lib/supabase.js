import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Durante la fase 1 las credenciales pueden estar vacías.
// Cuando se configuren, este cliente quedará listo para la fase 2.
export const supabase =
    supabaseUrl && supabasePublishableKey
        ? createClient(supabaseUrl, supabasePublishableKey)
        : null;
