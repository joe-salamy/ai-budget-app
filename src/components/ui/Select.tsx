// Select component - Dropdown selection UI component
import React from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options,
      placeholder,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id || props.name}
            className="block text-sm font-medium text-gray-200 mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "w-full px-3 py-2 bg-gray-800 border rounded-md text-gray-100",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-700 hover:border-gray-600",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
