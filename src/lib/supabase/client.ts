import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Client Supabase pour les composants exécutés côté navigateur.
 * Utilise uniquement la clé anonyme publique (NEXT_PUBLIC_SUPABASE_ANON_KEY).
 * Aucune clé secrète n'est exposée.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Si les variables ne sont pas encore configurées (ex: premier démarrage local sans .env.local),
    // on avertit pour éviter les erreurs silencieuses.
    console.warn(
      "Variables d'environnement Supabase manquantes. Vérifiez votre fichier .env.local."
    );
  }

  return createBrowserClient<Database>(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder-anon-key"
  );
}
