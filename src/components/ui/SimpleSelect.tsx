import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "./Select";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface SimpleSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function SimpleSelect({
  label,
  error,
  helperText,
  options = [],
  groups = [],
  placeholder = "Select an option...",
  value,
  onChange,
  disabled,
  required,
  className,
}: SimpleSelectProps) {
  const hasGroups = groups.length > 0;

  // Convert empty string to undefined for Radix UI Select
  const selectValue = value || undefined;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <Select value={selectValue} onValueChange={onChange} disabled={disabled} required={required}>
        <SelectTrigger className={error ? "border-destructive focus:ring-destructive" : ""}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {hasGroups
            ? groups.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.options.map((option: SelectOption) => (
                    <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))
            : options.map((option: SelectOption) => (
                <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </SelectItem>
              ))}
        </SelectContent>
      </Select>
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>}
    </div>
  );
}
