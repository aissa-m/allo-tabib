"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Lock, LogOut, ShieldCheck, Unlock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { loginAction, logoutAction, setLockedAction, type LoginState } from "./actions";

export function ControlLogin() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(async (prev: LoginState, fd: FormData) => {
    const next = await loginAction(prev, fd);
    if (!next.error) router.refresh();
    return next;
  }, {});

  return (
    <GlassCard strong className="w-full max-w-sm p-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage/10 text-sage">
          <KeyRound size={20} strokeWidth={1.5} aria-hidden />
        </span>
        <h1 className="text-xl">Acceso restringido</h1>
      </div>
      <form action={formAction} className="space-y-4">
        <Input
          name="password"
          type="password"
          label="Contraseña"
          autoComplete="current-password"
          autoFocus
          required
          error={state.error}
        />
        <Button type="submit" block loading={pending}>
          Entrar
        </Button>
      </form>
    </GlassCard>
  );
}

export function ControlPanel({ locked }: { locked: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<unknown>) => startTransition(async () => {
    await fn();
    router.refresh();
  });

  return (
    <GlassCard strong className="w-full max-w-md p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Estado de la web</p>
          <p className={cn("mt-1 flex items-center gap-2 text-2xl font-semibold", locked ? "text-offline" : "text-online")}>
            <span className={cn("h-2.5 w-2.5 rounded-full", locked ? "bg-offline" : "bg-online")} aria-hidden />
            {locked ? "Bloqueada" : "Activa"}
          </p>
        </div>
        <Button variant="ghost" size="sm" icon={LogOut} disabled={pending} onClick={() => run(logoutAction)}>
          Salir
        </Button>
      </div>

      <p className="mt-4 text-[15px] text-muted">
        {locked
          ? "Todas las rutas (landing, login, paneles y API) muestran el aviso «Veuillez contacter l'administrateur du site»."
          : "La web funciona con normalidad para todos los usuarios."}
      </p>

      <Button
        size="lg"
        block
        className="mt-6"
        variant={locked ? "primary" : "warning"}
        icon={locked ? Unlock : Lock}
        loading={pending}
        onClick={() => run(() => setLockedAction(!locked))}
      >
        {locked ? "Desbloquear la web" : "Bloquear la web"}
      </Button>

      <p className="mt-4 flex items-center gap-1.5 text-[13px] text-muted">
        <ShieldCheck size={14} strokeWidth={1.5} aria-hidden />
        El cambio tarda unos segundos en llegar a todos los servidores.
      </p>
    </GlassCard>
  );
}
