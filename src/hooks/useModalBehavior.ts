"use client";

import { useEffect, useRef } from "react";

/**
 * Locks background document scrolling and binds Escape-to-close while a modal
 * or drawer is open, restoring the previous body overflow value on cleanup.
 */
export function useModalBehavior(
  open: boolean,
  onClose: () => void,
  disabled = false
) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disabled) {
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, disabled]);
}
