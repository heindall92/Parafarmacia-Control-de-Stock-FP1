import { useCallback, useState } from "react";
import { logout, type AuthUser } from "../lib/auth";

export function useAuth() {
  // Siempre se arranca sin sesión: el login se muestra en cada apertura.
  // (Antes se auto-restauraba la sesión recordada y, al no haber botón de
  // cerrar sesión, el login quedaba inalcanzable.)
  const [user, setUser] = useState<AuthUser | null>(null);

  const signIn = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    logout();
    setUser(null);
  }, []);

  return {
    user,
    isAuthenticated: user !== null,
    signIn,
    signOut,
  };
}
