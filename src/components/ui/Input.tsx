import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AlertCircle, ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type FieldShellProps = {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
};

export function FieldShell({ id, label, hint, error, className, children }: FieldShellProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-[13px] text-terra">
          <AlertCircle size={14} strokeWidth={1.5} aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  icon?: LucideIcon;
  /** Contenido fijo al inicio del campo (p. ej. "+222"). */
  prefix?: string;
  endSlot?: ReactNode;
  wrapperClassName?: string;
};

/** Campo de texto con icono a la izquierda (a la derecha en RTL). */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, icon: Icon, prefix, endSlot, wrapperClassName, className, id: idProp, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            strokeWidth={1.5}
            aria-hidden
            className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
        )}
        {prefix && (
          <span
            dir="ltr"
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-[15px] text-muted",
              Icon ? "start-10" : "start-4",
            )}
          >
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            "field",
            prefix ? (Icon ? "ps-[5.25rem]" : "ps-14") : Icon && "ps-10",
            !!endSlot && "pe-12",
            error && "border-terra/60 focus:border-terra focus:ring-terra/20",
            className,
          )}
          {...rest}
        />
        {endSlot && <div className="absolute end-1.5 top-1/2 -translate-y-1/2">{endSlot}</div>}
      </div>
    </FieldShell>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  icon?: LucideIcon;
  wrapperClassName?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, icon: Icon, wrapperClassName, className, id: idProp, children, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      <div className="relative">
        {Icon && (
          <Icon size={18} strokeWidth={1.5} aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
        )}
        <select
          ref={ref}
          id={id}
          aria-invalid={!!error}
          className={cn("field appearance-none pe-10", Icon && "ps-10", error && "border-terra/60", className)}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown size={18} strokeWidth={1.5} aria-hidden className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    </FieldShell>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  icon?: LucideIcon;
  wrapperClassName?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, icon: Icon, wrapperClassName, className, id: idProp, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      <div className="relative">
        {Icon && <Icon size={18} strokeWidth={1.5} aria-hidden className="pointer-events-none absolute start-3.5 top-3.5 text-muted" />}
        <textarea
          ref={ref}
          id={id}
          aria-invalid={!!error}
          className={cn("field h-auto min-h-[110px] resize-none py-3", Icon && "ps-10", error && "border-terra/60", className)}
          {...rest}
        />
      </div>
    </FieldShell>
  );
});
