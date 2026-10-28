"use client";

import { useId, type ReactNode, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Field({
  label,
  hint,
  children,
  className,
  htmlFor,
  aside,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
  aside?: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-fg">
          {label}
        </label>
        {aside != null && <span className="font-mono text-xs text-fg-muted tabular-nums">{aside}</span>}
      </div>
      {children}
      {hint && <p className="text-xs text-fg-subtle">{hint}</p>}
    </div>
  );
}

export const INPUT_CLASS =
  "h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg pointer-coarse:h-11 pointer-coarse:text-base placeholder:text-fg-subtle hover:border-border-strong focus:border-primary focus:outline-none";

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(INPUT_CLASS, className)} {...rest} />;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  className,
  id,
  disabled,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        aria-label={label}
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
        className={cn(INPUT_CLASS, "tabular-nums disabled:opacity-50", suffix && "pr-10")}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-fg-subtle">
          {suffix}
        </span>
      )}
    </div>
  );
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
  hint,
  disabled,
}: {
  label: ReactNode;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} hint={hint} aside={format ? format(value) : value}>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer disabled:opacity-50 max-sm:h-8 pointer-coarse:h-11"
      />
    </Field>
  );
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: ReactNode;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn(INPUT_CLASS, "cursor-pointer pr-8")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
  className,
}: {
  label?: ReactNode;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: ReactNode; title?: string }>;
  hint?: ReactNode;
  className?: string;
}) {
  const group = (
    <div role="radiogroup" className={cn("flex w-full rounded-lg border border-border bg-surface-2 p-0.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium cursor-pointer pointer-coarse:min-h-11",
              active ? "bg-surface text-fg shadow-card ring-1 ring-border" : "text-fg-muted hover:text-fg",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
  if (!label) return group;
  return (
    <Field label={label} hint={hint}>
      {group}
    </Field>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 cursor-pointer"
      />
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm font-medium text-fg">{label}</span>
        {hint && <span className="block text-xs text-fg-subtle">{hint}</span>}
      </label>
    </div>
  );
}

export function ColorInput({ label, value, onChange }: { label: ReactNode; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} aside={value.toUpperCase()}>
      <input
        id={id}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full cursor-pointer rounded-lg border border-border bg-surface p-1 pointer-coarse:h-11"
      />
    </Field>
  );
}

export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "warning" | "danger" | "success";
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    info: "bg-primary-soft text-primary-strong border-primary/25",
    warning: "bg-warning-soft text-fg border-warning/50",
    danger: "bg-danger-soft text-danger border-danger/30",
    success: "bg-success-soft text-success-strong border-success/30",
  }[tone];
  return (
    <div role={tone === "danger" ? "alert" : undefined} className={cn("rounded-lg border px-3 py-2 text-sm", styles, className)}>
      {children}
    </div>
  );
}
