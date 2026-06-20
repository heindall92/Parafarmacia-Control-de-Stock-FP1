import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type CSSProperties } from "react";
import { Graphic } from "./CarouselGraphics";
import {
  PHARMACY_CAROUSEL_SLIDES,
  type CarouselCard,
  type CarouselSlide,
} from "../data/pharmacyCarouselSlides";

const SLIDE_MS = 5200;

const CARD_OFFSET: Record<CarouselCard["position"], { x: number; y: number; z: number }> = {
  tl: { x: -212, y: -118, z: 130 },
  tr: { x: 214, y: -96, z: 160 },
  bl: { x: -204, y: 132, z: 140 },
  br: { x: 214, y: 150, z: 110 },
};

function FloatingCard({ card, index }: { card: CarouselCard; index: number }) {
  const offset = CARD_OFFSET[card.position];
  return (
    <motion.div
      className={`login-floating-card login-floating-card--${card.position}`}
      initial={{ opacity: 0, x: offset.x * 0.4, y: offset.y * 0.4, z: -160, scale: 0.7 }}
      animate={{ opacity: 1, x: offset.x, y: offset.y, z: offset.z, scale: 1 }}
      exit={{ opacity: 0, z: -200, scale: 0.8 }}
      transition={{
        duration: 0.7,
        delay: 0.12 + index * 0.08,
        ease: [0.22, 0.8, 0.24, 1],
      }}
    >
      <div className="login-floating-card-row">
        <span className="login-floating-thumb">
          <Graphic name={card.thumb} className="login-floating-thumb-svg" />
        </span>
        <div className="login-floating-card-text">
          <h4>{card.title}</h4>
          <span>{card.subtitle}</span>
        </div>
        {card.badge ? <span className="login-floating-pill">{card.badge}</span> : null}
      </div>

      {card.metric ? (
        <p className={`login-floating-metric login-floating-metric--${card.metricTone ?? "default"}`}>
          {card.metric}
        </p>
      ) : null}

      {card.barPercent != null ? (
        <div className="login-floating-bar">
          <div className="login-floating-bar-fill" style={{ width: `${card.barPercent}%` }} />
        </div>
      ) : null}

      {card.list ? (
        <ul className="login-floating-list">
          {card.list.map((item) => (
            <li key={item.name}>
              <span>{item.name}</span>
              <span className={`login-floating-list-val login-floating-list-val--${item.tone ?? "default"}`}>
                {item.value}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </motion.div>
  );
}

function CarouselSlideView({ slide }: { slide: CarouselSlide }) {
  return (
    <motion.div
      className="login-hyper-slide"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="login-slide-panel"
        style={{ background: slide.color }}
        initial={{ rotateY: -42, opacity: 0, z: -180, scale: 0.86 }}
        animate={{ rotateY: 0, opacity: 1, z: 0, scale: 1 }}
        exit={{ rotateY: 42, opacity: 0, z: -180, scale: 0.86 }}
        transition={{ duration: 0.75, ease: [0.22, 0.8, 0.24, 1] }}
      >
        <span className="login-slide-tag">{slide.tag}</span>
        <h2 className="login-slide-title login-slide-title--top">{slide.titleTop}</h2>

        <div className="login-slide-ring" style={{ background: slide.accent }} aria-hidden="true">
          <div className="login-slide-ring-inner" style={{ borderColor: slide.color }} />
        </div>

        <h2 className="login-slide-title login-slide-title--bottom">{slide.titleBottom}</h2>

        {slide.badges.map((badge) => (
          <span key={badge.id} className={`login-slide-badge login-slide-badge--${badge.position}`}>
            <Graphic name={badge.icon} className="login-slide-badge-svg" />
          </span>
        ))}
      </motion.div>

      <motion.div
        className="login-slide-hero"
        initial={{ opacity: 0, y: 30, z: 80, scale: 0.7 }}
        animate={{ opacity: 1, y: 0, z: 220, scale: 1 }}
        exit={{ opacity: 0, z: 60, scale: 0.7 }}
        transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 0.8, 0.24, 1] }}
      >
        <Graphic name={slide.hero} className="login-slide-hero-svg" />
      </motion.div>

      {slide.cards.map((card, index) => (
        <FloatingCard key={card.id} card={card} index={index} />
      ))}
    </motion.div>
  );
}

export function PharmacyHyperCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = PHARMACY_CAROUSEL_SLIDES;
  const activeSlide = slides[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="login-carousel-shell">
      <div
        className="login-carousel-viewport"
        style={{ "--slide-color": activeSlide.color, "--slide-tint": activeSlide.tint } as CSSProperties}
      >
        <div
          className="login-carousel-aura"
          style={{ background: activeSlide.tint }}
          aria-hidden="true"
        />
        <div className="login-carousel-scene">
          <AnimatePresence mode="wait">
            <CarouselSlideView key={activeSlide.id} slide={activeSlide} />
          </AnimatePresence>
        </div>
      </div>

      <div className="login-carousel-dots" role="tablist" aria-label="Módulos de la parafarmacia">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={slide.titleBottom}
            className={`login-carousel-dot ${index === activeIndex ? "login-carousel-dot--active" : ""}`}
            style={index === activeIndex ? { background: slide.color, boxShadow: `0 0 12px ${slide.color}` } : undefined}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>

      <p className="login-carousel-caption">
        Gestión integral · inventario, lotes y despacho en un solo panel offline
      </p>
    </div>
  );
}
