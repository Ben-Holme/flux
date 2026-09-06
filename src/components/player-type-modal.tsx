"use client";

import Button from "@/components/button";
import { Flow, Heading, Text } from "@/components/ui";

export function PlayerTypeModal({
  value,
  pending,
  onSelect,
  onClose,
}: {
  value: 1 | 2 | null;
  pending: boolean;
  onSelect: (v: 1 | 2) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface flex w-full max-w-md flex-col gap-6 rounded-lg p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <Flow>
          <Heading level="h3">Player style</Heading>
          <Text>
            Are you ready for the full early access experience, and lead the spiritfolk to glory?
            Or do you want to follow the action from the sidelines for now?
          </Text>
        </Flow>
        <div className="flex gap-3">
          <Button variant={value === 2 ? "primary" : "ghost"} disabled={pending} onClick={() => onSelect(2)}>
            Idle
          </Button>
          <Button variant={value === 1 ? "primary" : "ghost"} disabled={pending} onClick={() => onSelect(1)}>
            Active
          </Button>
        </div>
      </div>
    </div>
  );
}
