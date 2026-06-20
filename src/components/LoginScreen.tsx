import { Eye, EyeOff, Lock, ShieldCheck, User, WifiOff } from "lucide-react";
import { FormEvent, useState } from "react";
import { getDemoHint, getRememberedUsername, login, type AuthUser } from "../lib/auth";
import { PharmacyHyperCarousel } from "./PharmacyHyperCarousel";
import { SplashGeometricBackground } from "./SplashGeometricBackground";

type LoginScreenProps = {
  onSuccess: (user: AuthUser) => void;
};

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState(() => getRememberedUsername() || "farmacia");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => getRememberedUsername() !== "");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = login(username, password, remember);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    window.setTimeout(() => {
      onSuccess(result.user);
    }, 320);
  };

  return (
    <SplashGeometricBackground>
      <div className="login-screen login-screen-enter">
        <div className="login-layout">
          <section className="login-carousel-panel" aria-label="Vista previa de módulos">
            <PharmacyHyperCarousel />
          </section>

          <section className="login-form-panel">
            <div className="login-form-card">
              <div className="login-form-brand">
                <div className="login-form-logo">
                  <img src="/app-icon.svg" alt="Parafarmacia Stock" draggable={false} />
                </div>
                <div>
                  <p className="login-form-brand-tag">Parafarmacia Stock</p>
                  <h1 className="login-form-title">Accede a tu panel</h1>
                </div>
              </div>

              <p className="login-form-lead">
                Inventario por estante, trazabilidad de lotes y control de salidas — todo en local, sin
                conexión.
              </p>

              <form className="login-form" onSubmit={handleSubmit}>
                <label className="login-field">
                  <span>Usuario</span>
                  <span className="login-input-wrap">
                    <User size={18} aria-hidden="true" />
                    <input
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="farmacia"
                      required
                    />
                  </span>
                </label>

                <label className="login-field">
                  <span>Contraseña</span>
                  <span className="login-input-wrap">
                    <Lock size={18} aria-hidden="true" />
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                </label>

                <label className="login-remember">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                  />
                  <span>Recordar mi usuario en este equipo</span>
                </label>

                {error ? <p className="login-form-error">{error}</p> : null}

                <button type="submit" className="login-submit" disabled={submitting}>
                  {submitting ? "Entrando…" : "Entrar al panel"}
                </button>
              </form>

              <div className="login-form-badges">
                <span>
                  <WifiOff size={14} />
                  Modo offline
                </span>
                <span>
                  <ShieldCheck size={14} />
                  Datos locales
                </span>
              </div>

              <p className="login-form-hint">
                Acceso demo: <code>{getDemoHint()}</code>
              </p>
            </div>
          </section>
        </div>
      </div>
    </SplashGeometricBackground>
  );
}
