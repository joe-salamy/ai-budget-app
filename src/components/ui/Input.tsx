import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";

import { cn, formatNumberWithCommas, parseNumberWithCommas, formatDateInput } from "@/lib/utils";
import { format, parse, isValid } from "date-fns";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      helperText,
      fullWidth = false,
      id,
      disabled,
      onChange,
      onBlur,
      value,
      ...props
    },
    ref
  ) => {
    // Generate ID if not provided (for label association)
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const isNumberInput = type === "number";
    const isDateInput = type === "date";

    // Local state for date input - tracks formatted user input while typing
    const [isDateFocused, setIsDateFocused] = useState(false);
    const [dateDisplayValue, setDateDisplayValue] = useState("");

    // Handle number input changes - remove commas for storage
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isNumberInput && onChange) {
        const rawValue = e.target.value;
        const cleanValue = parseNumberWithCommas(rawValue);
        // Create a new event with the clean value
        const newEvent = {
          ...e,
          target: {
            ...e.target,
            value: cleanValue,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(newEvent);
      } else if (onChange) {
        onChange(e);
      }
    };

    // Format number with commas on blur
    const handleNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (isNumberInput) {
        const rawValue = e.target.value;
        if (rawValue) {
          const formatted = formatNumberWithCommas(rawValue);
          e.target.value = formatted;
        }
      }
      if (onBlur) {
        onBlur(e);
      }
    };

    // Handle date input focus
    const handleDateFocus = (_e: React.FocusEvent<HTMLInputElement>) => {
      if (isDateInput) {
        setIsDateFocused(true);
        // Initialize display value from current value
        if (value) {
          try {
            const parsedDate = parse(String(value), "yyyy-MM-dd", new Date());
            if (isValid(parsedDate)) {
              setDateDisplayValue(format(parsedDate, "MM/dd/yyyy"));
            } else {
              setDateDisplayValue(String(value));
            }
          } catch {
            setDateDisplayValue(String(value));
          }
        } else {
          setDateDisplayValue("");
        }
      }
    };

    // Handle date input changes - auto-format with slashes
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isDateInput) {
        const rawValue = e.target.value;
        const formatted = formatDateInput(rawValue);
        setDateDisplayValue(formatted);
      } else if (onChange) {
        onChange(e);
      }
    };

    // Handle date blur - convert to yyyy-MM-dd if valid
    const handleDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (isDateInput) {
        setIsDateFocused(false);
        const inputValue = dateDisplayValue;

        if (inputValue && onChange) {
          // Try to parse the current input
          try {
            let parsedDate = parse(inputValue, "MM/dd/yyyy", new Date());
            if (!isValid(parsedDate)) {
              parsedDate = parse(inputValue, "M/d/yyyy", new Date());
            }

            if (isValid(parsedDate)) {
              const dateValue = format(parsedDate, "yyyy-MM-dd");
              const newEvent = {
                ...e,
                target: {
                  ...e.target,
                  value: dateValue,
                },
              } as React.ChangeEvent<HTMLInputElement>;
              onChange(newEvent);
            }
          } catch {
            // Invalid date, don't update
          }
        } else if (!inputValue && onChange) {
          // Empty input - clear the value
          const newEvent = {
            ...e,
            target: {
              ...e.target,
              value: "",
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(newEvent);
        }
      }
      if (onBlur) {
        onBlur(e);
      }
    };

    // Format the display value for number and date inputs
    let displayValue = value;
    if (isNumberInput && value) {
      displayValue = formatNumberWithCommas(String(value));
    } else if (isDateInput) {
      if (isDateFocused) {
        // While focused, show the user's typed input
        displayValue = dateDisplayValue;
      } else if (value) {
        // When not focused, convert yyyy-MM-dd to MM/dd/yyyy for display
        try {
          const parsedDate = parse(String(value), "yyyy-MM-dd", new Date());
          if (isValid(parsedDate)) {
            displayValue = format(parsedDate, "MM/dd/yyyy");
          }
        } catch {
          displayValue = value;
        }
      }
    }

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        {isNumberInput ? (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base md:text-sm text-foreground pointer-events-none">
              $
            </span>
            <input
              id={inputId}
              type="text"
              inputMode="decimal"
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-background pl-7 pr-3 py-1 text-base shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                error && "border-destructive focus-visible:ring-destructive",
                fullWidth && "w-full",
                className
              )}
              ref={ref}
              disabled={disabled}
              value={displayValue}
              onChange={handleNumberChange}
              onBlur={handleNumberBlur}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={
                error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
              }
              {...props}
            />
          </div>
        ) : isDateInput ? (
          <div className="relative">
            <input
              id={inputId}
              type="text"
              inputMode="numeric"
              placeholder="mm/dd/yyyy"
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                error && "border-destructive focus-visible:ring-destructive",
                fullWidth && "w-full",
                className
              )}
              ref={ref}
              disabled={disabled}
              value={displayValue}
              onChange={handleDateChange}
              onFocus={handleDateFocus}
              onBlur={handleDateBlur}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={
                error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
              }
              {...props}
            />
            <div className="absolute inset-0 flex items-center px-3 pointer-events-none text-base md:text-sm z-10">
              {isDateFocused && dateDisplayValue.length > 0 && dateDisplayValue.length < 10 && (
                <>
                  <span className="opacity-0">{dateDisplayValue}</span>
                  <span className="text-muted-foreground opacity-60">{"mm/dd/yyyy".slice(dateDisplayValue.length)}</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <input
            id={inputId}
            type={type}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              error && "border-destructive focus-visible:ring-destructive",
              fullWidth && "w-full",
              className
            )}
            ref={ref}
            disabled={disabled}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
