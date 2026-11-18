/**
 * Módulo de Autenticación y Gestión de Sesiones (HU-01)
 * Integrado con Supabase Auth y directivas RLS.
 */

import { createClient as createBrowserClient } from "@/lib/supabase/client";

export interface SessionUser {
  id: string;
  email: string;
  nombre_completo?: string;
}

/**
 * Obtiene el usuario autenticado actualmente desde el cliente
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = createBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email || "",
    nombre_completo:
      user.user_metadata?.nombre_completo || user.email?.split("@")[0] || "Usuario",
  };
}

/**
 * Cierra la sesión activa del usuario
 */
export async function signOutUser(): Promise<void> {
  const supabase = createBrowserClient();
  await supabase.auth.signOut();
}
