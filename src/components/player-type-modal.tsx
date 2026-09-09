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
            Ready to play when your invitation arrives, or following along for now? Let us know so
            we can plan. You can change this in Settings.
          </Text>
        </Flow>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            variant={value === 1 ? "primary" : "ghost"}
            disabled={pending}
            onClick={() => onSelect(1)}
          >
            I&apos;m so ready!!!
          </Button>
          <Button
            variant={value === 2 ? "primary" : "ghost"}
            disabled={pending}
            onClick={() => onSelect(2)}
          >
            Lurker for now
          </Button>
        </div>
      </div>
    </div>
  );
}
