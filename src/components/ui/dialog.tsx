"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useLenis } from "lenis/react";
import Button from "@/components/button";
import { Heading } from "./heading";

interface DialogProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}

/** Mount to open; the native modal provides focus trapping and focus restoration. */
export function Dialog({ title, children, onClose, busy = false }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const lenis = useLenis();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const overflow = document.documentElement.style.overflow;
    const wasStopped = lenis?.isStopped;
    document.documentElement.style.overflow = "hidden";
    lenis?.stop();
    dialog.showModal();

    return () => {
      dialog.close();
      document.documentElement.style.overflow = overflow;
      if (!wasStopped) lenis?.start();
    };
  }, [lenis]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-busy={busy}
      data-lenis-prevent
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="bg-surface text-parchment fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-lg border border-white/10 p-0 shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
        <div id={titleId}>
          <Heading level="h2" className="text-3xl">
            {title}
          </Heading>
        </div>
        <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
