"use client";

import { useRef, useEffect, useCallback, type ReactNode } from "react";

export interface BottomSheetProps {
  /** Content rendered in the header row (next to the close button). */
  title: ReactNode;
  /** Scrollable body content. */
  children: ReactNode;
  /**
   * Called after the close animation finishes.
   * Unmount / hide the sheet in this callback.
   */
  onClose: () => void;

  // ── Height config ─────────────────────────────────────────────────────────
  /**
   * Sheet height at the "partial" snap as a fraction of viewport height.
   * @default 0.8
   */
  partialRatio?: number;
  /**
   * When set, adds a third "minimized" snap point between closed and partial.
   * The user can drag down from partial → minimized, then further to close.
   * Must be less than partialRatio.
   */
  minimizedRatio?: number;
  /**
   * Distance in px from the top of the viewport where the "full" snap stops.
   * Usually the height of the top bar.
   * @default 57
   */
  topOffset?: number;
  /**
   * Fraction of the current snap-point height below which releasing a drag
   * triggers close. Applied to partial (when no minimizedRatio) or minimized.
   * @default 0.55
   */
  closeThreshold?: number;

  // ── Snap thresholds ───────────────────────────────────────────────────────
  /**
   * Minimum px of height gained above the current snap to advance upward.
   * @default 50
   */
  snapUpPx?: number;
  /**
   * Minimum px of height lost below the current snap to drop downward.
   * @default 80
   */
  snapDownPx?: number;

  // ── Presentation ──────────────────────────────────────────────────────────
  /** CSS z-index for the sheet + backdrop. @default 1100 */
  zIndex?: number;
  /** Opacity of the black backdrop, 0–100. @default 30 */
  backdropOpacity?: number;
}

const EASE = "cubic-bezier(0.32,0.72,0,1)";
const DUR  = "0.28s";

export function BottomSheet({
  title,
  children,
  onClose,
  partialRatio    = 0.8,
  minimizedRatio,
  topOffset       = 57,
  closeThreshold  = 0.55,
  snapUpPx        = 50,
  snapDownPx      = 80,
  zIndex          = 1100,
  backdropOpacity = 30,
}: BottomSheetProps) {
  const sheetRef     = useRef<HTMLDivElement>(null);
  const dragZoneRef  = useRef<HTMLDivElement>(null);
  const contentRef   = useRef<HTMLDivElement>(null);
  const snapRef      = useRef<"minimized" | "partial" | "full">("partial");
  const dragging     = useRef(false);
  const startY       = useRef(0);
  const startH       = useRef(0);
  const closingRef   = useRef(false);
  // Tracks a pointer that started in the content area before we decide to capture
  const pendingId    = useRef<number | null>(null);

  const partialH = useCallback(
    () => Math.min(window.innerHeight * partialRatio, window.innerHeight - topOffset),
    [partialRatio, topOffset],
  );
  const fullH = useCallback(
    () => window.innerHeight - topOffset,
    [topOffset],
  );
  const minimizedH = useCallback(
    () => minimizedRatio ? Math.min(window.innerHeight * minimizedRatio, partialH() - 1) : 0,
    [minimizedRatio, partialH],
  );

  // ── Close animation ────────────────────────────────────────────────────────
  const triggerClose = useCallback(() => {
    if (closingRef.current || !sheetRef.current) return;
    closingRef.current = true;
    const el = sheetRef.current;
    el.style.transition = `transform ${DUR} ${EASE}`;
    el.style.transform  = "translateY(110%)";
    setTimeout(onClose, 290);
  }, [onClose]);

  // ── Slide in on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;

    snapRef.current    = "partial";
    closingRef.current = false;

    el.style.transition = "none";
    el.style.height     = `${partialH()}px`;
    el.style.transform  = "translateY(110%)";

    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        el.style.transition = `transform ${DUR} ${EASE}`;
        el.style.transform  = "translateY(0)";
      }),
    );
    return () => cancelAnimationFrame(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs only on mount

  // ── Shared drag helpers ───────────────────────────────────────────────────
  function beginDrag(y: number) {
    dragging.current = true;
    startY.current   = y;
    startH.current   = sheetRef.current?.getBoundingClientRect().height ?? partialH();
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  }

  function moveDrag(clientY: number) {
    if (!dragging.current || !sheetRef.current) return;
    const delta = startY.current - clientY; // +ve = up = grow
    const newH  = Math.max(
      partialH() * 0.25,
      Math.min(fullH(), startH.current + delta),
    );
    sheetRef.current.style.height = `${newH}px`;
  }

  function endDrag() {
    if (!dragging.current || !sheetRef.current) return;
    dragging.current = false;

    const el       = sheetRef.current;
    const currentH = el.getBoundingClientRect().height;
    const ph       = partialH();
    const fh       = fullH();
    const mh       = minimizedRatio ? minimizedH() : null;

    el.style.transition = `height ${DUR} ${EASE}`;

    if (snapRef.current === "full") {
      if (currentH < fh - snapDownPx) {
        el.style.height = `${ph}px`;
        snapRef.current = "partial";
      } else {
        el.style.height = `${fh}px`;
      }
    } else if (snapRef.current === "partial") {
      if (currentH > ph + snapUpPx) {
        el.style.height = `${fh}px`;
        snapRef.current = "full";
      } else if (mh !== null && currentH < ph - snapDownPx) {
        // Drop to minimized snap point
        el.style.height = `${mh}px`;
        snapRef.current = "minimized";
      } else if (mh === null && currentH < ph * closeThreshold) {
        // No minimized state — close directly
        triggerClose();
      } else {
        el.style.height = `${ph}px`;
      }
    } else {
      // "minimized"
      if (currentH > mh! + snapUpPx) {
        el.style.height = `${ph}px`;
        snapRef.current = "partial";
      } else if (currentH < mh! * closeThreshold) {
        triggerClose();
      } else {
        el.style.height = `${mh!}px`;
      }
    }
  }

  // ── Pointer handlers on the WHOLE sheet ──────────────────────────────────
  // • Handle zone (pill + title row): capture immediately → all directions
  // • Content zone: defer until we confirm a downward swipe from scroll-top
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;

    const isHandleZone = dragZoneRef.current?.contains(e.target as Node) ?? false;

    if (isHandleZone) {
      e.currentTarget.setPointerCapture(e.pointerId);
      beginDrag(e.clientY);
    } else {
      // Content zone — remember it; we'll decide in move
      pendingId.current = e.pointerId;
      startY.current    = e.clientY;
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    // Pending content-zone capture
    if (!dragging.current && pendingId.current === e.pointerId) {
      const deltaDown = e.clientY - startY.current; // +ve = user moved DOWN
      const scrollTop = contentRef.current?.scrollTop ?? 0;

      if (deltaDown > 8 && scrollTop === 0) {
        // Intercept: user is pulling down from scroll-top → treat as close gesture
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
        pendingId.current = null;
        beginDrag(e.clientY); // re-anchor from current position
      } else if (Math.abs(deltaDown) > 8) {
        // Scroll or upward swipe from content → let browser handle
        pendingId.current = null;
      }
      return;
    }

    moveDrag(e.clientY);
  }

  function onPointerUp(_e: React.PointerEvent<HTMLDivElement>) {
    pendingId.current = null;
    endDrag();
  }

  function onPointerCancel(_e: React.PointerEvent<HTMLDivElement>) {
    pendingId.current = null;
    endDrag();
  }

  return (
    <div className="fixed inset-0 flex flex-col justify-end" style={{ zIndex }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: backdropOpacity / 100 }}
        onClick={triggerClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative bg-card rounded-t-3xl flex flex-col overflow-hidden shadow-2xl"
        style={{ willChange: "transform, height" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {/* ── Drag zone: pill + title row ── */}
        <div
          ref={dragZoneRef}
          className="flex-shrink-0 touch-none select-none cursor-grab active:cursor-grabbing"
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-card-border" />
          </div>
          <div className="flex items-center justify-between px-4 pb-3 border-b border-card-border">
            <div className="flex-1 pr-3 min-w-0">{title}</div>
            <button
              onClick={triggerClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div ref={contentRef} className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
