const SESSION_KEY = "farma-auth-session";
const REMEMBER_KEY = "farma-auth-remember";
const LAST_USER_KEY = "farma-auth-last-user";

export type AuthUser = {
  username: string;
  displayName: string;
  loggedInAt: string;
};

/** Credenciales locales de demo — app 100% offline */
const VALID_USERS: Record<string, { password: string; displayName: string }> = {
  farmacia: { password: "stock2026", displayName: "Equipo Parafarmacia" },
  admin: { password: "admin", displayName: "Administrador" },
};

export function getStoredSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isRememberEnabled(): boolean {
  return localStorage.getItem(REMEMBER_KEY) === "true";
}

/** Último usuario recordado (solo para precargar el campo, NO inicia sesión solo). */
export function getRememberedUsername(): string {
  return localStorage.getItem(LAST_USER_KEY) ?? "";
}

export function login(
  username: string,
  password: string,
  remember: boolean
): { ok: true; user: AuthUser } | { ok: false; error: string } {
  const normalized = username.trim().toLowerCase();
  const entry = VALID_USERS[normalized];

  if (!entry || entry.password !== password) {
    return { ok: false, error: "Usuario o contraseña incorrectos." };
  }

  const user: AuthUser = {
    username: normalized,
    displayName: entry.displayName,
    loggedInAt: new Date().toISOString(),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
  if (remember) {
    localStorage.setItem(LAST_USER_KEY, normalized);
  } else {
    localStorage.removeItem(LAST_USER_KEY);
  }

  return { ok: true, user };
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

export function getDemoHint(): string {
  return "farmacia / stock2026 · admin / admin";
}
