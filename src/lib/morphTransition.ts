type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    finished: Promise<void>;
    ready: Promise<void>;
    updateCallbackDone: Promise<void>;
  };
};

export type WaveOrigin = {
  x: number;
  y: number;
  radius: number;
};

export function runMorphTransition(
  update: () => void | Promise<void>,
  wave?: WaveOrigin
) {
  const doc = document as ViewTransitionDocument;
  const root = document.documentElement;

  if (wave) {
    root.style.setProperty("--wave-x", `${wave.x}px`);
    root.style.setProperty("--wave-y", `${wave.y}px`);
    root.style.setProperty("--wave-r", `${wave.radius}px`);
    root.classList.add("theme-wave");
  }

  const finish = () => {
    if (wave) root.classList.remove("theme-wave");
  };

  if (!doc.startViewTransition) {
    void Promise.resolve(update()).finally(finish);
    return;
  }

  const transition = doc.startViewTransition(() => {
    void Promise.resolve(update());
  });

  void transition.finished.finally(finish);
}

export function getWaveOriginFromClick(event: React.MouseEvent<HTMLElement>): WaveOrigin {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius =
    Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    ) * 1.15;

  return { x, y, radius };
}
