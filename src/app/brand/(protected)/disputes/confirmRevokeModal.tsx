import { Button } from "@/components/ui/buttonComp";
import { X } from "@phosphor-icons/react";
import { useEffect } from "react";

export default function ConfirmRevokeModal({
  open,
  onClose,
  onConfirm,
  isSubmitting,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, isSubmitting]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="w-full max-w-[48.3125rem] overflow-hidden rounded-[1rem] bg-white shadow-[0_24px_64px_rgba(0,0,0,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e8e8e8] px-5 py-3.5">
          <h3 className="text-[1.0625rem] font-semibold leading-6 text-[#1a1a1a]">
            Withdraw Dispute
          </h3>

          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[#1a1a1a] !border-none !shadow-none transition hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="size-[1rem]" />
          </Button>
        </div>

        <div className="border-b border-[#e8e8e8] px-5 py-6">
          <p className="text-[0.9375rem] leading-7 text-[#8a8a8a]">
            You are about to{" "}
            <span className="font-semibold text-[#1a1a1a]">
              withdraw this dispute
            </span>{" "}
            request. Once withdrawn, the dispute will be closed and cannot be
            reopened.
          </p>

          {error && (
            <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-3">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[0.75rem] !border-none !shadow-none font-medium text-[#1a1a1a] transition hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isSubmitting}
            className="inline-flex h-10 min-w-[82px] items-center justify-center rounded-[0.625rem] bg-[#111111] px-5 text-[0.75rem] font-medium text-white transition hover:bg-[#222222] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}