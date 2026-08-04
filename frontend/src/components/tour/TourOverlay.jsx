import { useEffect, useMemo, useState } from "react";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function TourOverlay({ open, step, stepIndex, totalSteps, onNext, onPrev, onClose }) {
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    if (!open || !step?.target) {
      setTargetRect(null);
      return;
    }

    let rafId = 0;

    const updateRect = () => {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    };

    const loop = () => {
      updateRect();
      rafId = requestAnimationFrame(loop);
    };

    updateRect();
    rafId = requestAnimationFrame(loop);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [open, step]);

  useEffect(() => {
    if (!open || !step?.target) {
      return;
    }

    const scrollTargetIntoView = () => {
      const element = document.querySelector(step.target);
      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const topBuffer = 120;
      const bottomBuffer = 90;
      const isAbove = rect.top < topBuffer;
      const isBelow = rect.bottom > window.innerHeight - bottomBuffer;

      if (isAbove || isBelow) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    };

    const timerId = setTimeout(scrollTargetIntoView, 180);
    return () => clearTimeout(timerId);
  }, [open, stepIndex, step]);

  const panelStyle = useMemo(() => {
    const panelWidth = 340;
    const spacing = 18;

    if (!targetRect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const centerX = targetRect.left + targetRect.width / 2;
    const aboveTop = targetRect.top - 220;
    const belowTop = targetRect.bottom + spacing;
    const left = clamp(centerX - panelWidth / 2, 14, window.innerWidth - panelWidth - 14);
    const renderAbove = targetRect.top > 260;
    const top = renderAbove ? Math.max(20, aboveTop) : Math.min(window.innerHeight - 220, belowTop);

    return { top: `${top}px`, left: `${left}px` };
  }, [targetRect]);

  if (!open || !step) {
    return null;
  }

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="Website tour">
      {targetRect && (
        <div
          className="tour-highlight"
          style={{
            top: `${targetRect.top - 8}px`,
            left: `${targetRect.left - 8}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`,
          }}
        />
      )}

      {targetRect && (
        <div
          className="tour-arrow"
          style={{
            top: `${targetRect.top + targetRect.height / 2}px`,
            left: `${targetRect.left + targetRect.width + 14}px`,
          }}
        />
      )}

      <div className="tour-card" style={panelStyle}>
        <div className="tour-card__spark tour-card__spark--one" />
        <div className="tour-card__spark tour-card__spark--two" />
        <p className="tour-card__count">
          Step {stepIndex + 1} of {totalSteps}
        </p>
        <h3 className="tour-card__title">{step.title}</h3>
        <p className="tour-card__desc">{step.description}</p>

        <div className="tour-card__actions">
          <button type="button" className="tour-btn tour-btn--ghost" onClick={onClose}>
            Skip Tour
          </button>
          <div className="tour-btn-group">
            <button type="button" className="tour-btn tour-btn--light" onClick={onPrev} disabled={stepIndex === 0}>
              Previous
            </button>
            <button type="button" className="tour-btn tour-btn--primary" onClick={onNext}>
              {stepIndex === totalSteps - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
