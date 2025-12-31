import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, value, onChange, readOnly, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { value?: string | number | readonly string[] | null }) {
  // Normalize null/undefined value to empty string
  const normalizedValue = value == null ? "" : value as any;

  // If a `value` prop is provided but no `onChange` and not readOnly,
  // render as uncontrolled using `defaultValue` to avoid React warning
  const hasValueProp = value !== undefined;
  const isControlled = hasValueProp && typeof onChange === 'function';

  const inputClass = cn(
    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    className,
  );

  if (hasValueProp && !isControlled && !readOnly) {
    return (
      <input
        type={type}
        data-slot="input"
        defaultValue={normalizedValue}
        className={inputClass}
        {...props}
      />
    );
  }

  // Build props carefully to avoid passing a `value` without `onChange` (read-only warning)
  const finalProps: Record<string, any> = {
    type,
    'data-slot': 'input',
    className: inputClass,
    ...props,
  };

  if (hasValueProp) {
    finalProps.value = normalizedValue;
  }

  if (isControlled) {
    finalProps.onChange = onChange;
  }

  if (readOnly) {
    finalProps.readOnly = readOnly;
  }

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <input {...finalProps} />
  );
}

export { Input };
