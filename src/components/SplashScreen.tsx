import { LayoutGrid, ShieldCheck, WifiOff } from "lucide-react";
import { BOOTSTRAP_STEPS } from "../hooks/useAppBootstrap";
import { AuroraBackground } from "./AuroraBackground";

type SplashScreenProps = {
  step: number;
  progress: number;
  exiting: boolean;
  onExitComplete: () => void;
};

export function SplashScreen({ step, progress, exiting, onExitComplete }: SplashScreenProps) {
  return (
    <AuroraBackground>
      <div
        className={`splash-screen ${exiting ? "splash-screen--exit" : ""}`}
        onAnimationEnd={(event) => {
          if (exiting && event.animationName === "splash-screen-exit") {
            onExitComplete();
          }
        }}
      >
        <div className="splash-grid" aria-hidden="true" />

        <div className="splash-orbit splash-orbit--a" aria-hidden="true" />
        <div className="splash-orbit splash-orbit--b" aria-hidden="true" />

        <div className="hyper-frame">
          <span className="hyper-frame-corner hyper-frame-corner--tl" aria-hidden="true" />
          <span className="hyper-frame-corner hyper-frame-corner--tr" aria-hidden="true" />
          <span className="hyper-frame-corner hyper-frame-corner--bl" aria-hidden="true" />
          <span className="hyper-frame-corner hyper-frame-corner--br" aria-hidden="true" />

          <div className="hyper-frame-inner">
            <div className="splash-brand">
              <div className="splash-logo">
                <LayoutGrid size={28} strokeWidth={2.25} />
              </div>
              <div className="splash-title">
                <span className="splash-title-main">
                  farma<span className="splash-title-dot">.</span>
                </span>
                <span className="splash-title-sub">Parafarmacia Stock</span>
              </div>
            </div>

            <p className="splash-tagline">
              Control de inventario por estante y cuadrante · 100% offline
            </p>

            <div className="splash-progress-block">
              <div className="splash-progress-track">
                <div
                  className="splash-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="splash-progress-meta">
                <span>{Math.round(progress)}%</span>
                <span className="splash-progress-step">
                  {BOOTSTRAP_STEPS[Math.max(0, step - 1)] ?? BOOTSTRAP_STEPS[0]}
                </span>
              </div>
            </div>

            <ul className="splash-steps" aria-label="Progreso de carga">
              {BOOTSTRAP_STEPS.map((label, index) => {
                const stepNumber = index + 1;
                const isDone = step > stepNumber;
                const isActive = step === stepNumber;

                return (
                  <li
                    key={label}
                    className={`splash-step ${isDone ? "splash-step--done" : ""} ${
                      isActive ? "splash-step--active" : ""
                    }`}
                  >
                    <span className="splash-step-indicator" aria-hidden="true">
                      {isDone ? "✓" : stepNumber}
                    </span>
                    <span>{label}</span>
                  </li>
                );
              })}
            </ul>

            <div className="splash-badges">
              <span className="splash-badge">
                <WifiOff size={14} />
                Modo offline
              </span>
              <span className="splash-badge">
                <ShieldCheck size={14} />
                Datos locales
              </span>
              <span className="splash-badge splash-badge--muted">v0.1.0</span>
            </div>
          </div>
        </div>

        <p className="splash-footer">Preparando tu panel de trabajo…</p>
      </div>
    </AuroraBackground>
  );
}
