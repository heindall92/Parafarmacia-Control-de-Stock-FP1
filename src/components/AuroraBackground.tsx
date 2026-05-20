type AuroraBackgroundProps = {
  children: React.ReactNode;
};

export function AuroraBackground({ children }: AuroraBackgroundProps) {
  return (
    <div className="app-shell relative h-full overflow-hidden">
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-glow aurora-glow-tr" />
        <div className="aurora-glow aurora-glow-bl" />
        <div className="aurora-glow aurora-glow-br" />
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
      </div>
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
