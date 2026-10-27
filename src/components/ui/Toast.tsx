"use client";

import { Toaster as Sonner, toast } from "sonner";
import { useTheme } from "./ThemeProvider";

/** Toasts discretos de cristal. Usa `toast.success(...)` / `toast.error(...)`. */
export function Toaster({ dir }: { dir: "ltr" | "rtl" }) {
  const { resolved } = useTheme();
  return (
    <Sonner
      dir={dir}
      theme={resolved}
      position="top-center"
      duration={2600}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-2xl !border !border-white/30 !bg-white/70 !text-ink !shadow-glass !backdrop-blur-xl dark:!border-white/10 dark:!bg-[#1A2530]/85 !font-sans",
          success: "[&_[data-icon]]:!text-sage",
          error: "[&_[data-icon]]:!text-terra",
        },
      }}
    />
  );
}

export { toast };
