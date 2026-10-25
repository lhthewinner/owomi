import { NextResponse } from "next/server";
import { createServerSideClient } from "@/lib/supabase/server";

/**
 * Route handler d'échange de code d'authentification Supabase (PKCE).
 * Permet la validation des liens envoyés par email :
 * - Confirmation d'adresse email
 * - Réinitialisation de mot de passe oublié
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createServerSideClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (next === "reset-password") {
        return NextResponse.redirect(`${origin}/?view=reset-password`);
      }
      return NextResponse.redirect(`${origin}/`);
    }
  }

  if (next === "reset-password") {
    return NextResponse.redirect(`${origin}/?view=reset-password`);
  }

  return NextResponse.redirect(`${origin}/`);
}
