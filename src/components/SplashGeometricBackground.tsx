type SplashGeometricBackgroundProps = {
  children: React.ReactNode;
};

export function SplashGeometricBackground({ children }: SplashGeometricBackgroundProps) {
  return (
    <div className="splash-geo-shell">
      <div className="splash-geo-bg" aria-hidden="true">
        <div className="splash-geo-base" />
        <div className="splash-geo-disc splash-geo-disc--1" />
        <div className="splash-geo-disc splash-geo-disc--2" />
        <div className="splash-geo-disc splash-geo-disc--3" />
        <div className="splash-geo-disc splash-geo-disc--4" />
        <div className="splash-geo-disc splash-geo-disc--5" />
        <div className="splash-geo-disc splash-geo-disc--6" />
        <div className="splash-geo-sheen" />
        <span className="splash-geo-meteor splash-geo-meteor--1" />
        <span className="splash-geo-meteor splash-geo-meteor--2" />
        <span className="splash-geo-meteor splash-geo-meteor--3" />
        <span className="splash-geo-meteor splash-geo-meteor--4" />
        <span className="splash-geo-meteor splash-geo-meteor--5" />
        <span className="splash-geo-meteor splash-geo-meteor--6" />
        <span className="splash-geo-meteor splash-geo-meteor--7" />
        <span className="splash-geo-meteor splash-geo-meteor--8" />
      </div>
      <div className="splash-geo-content">{children}</div>
    </div>
  );
}
