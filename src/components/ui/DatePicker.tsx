import { useMemo, useState } from "react";
import type { KeyboardEvent, FocusEvent, ChangeEvent } from "react";
import { Button } from "./Button";
import { Calendar } from "./Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn, formatDateInput } from "../../lib/utils";

interface DatePickerProps {
  date: string; // yyyy-MM-dd format
  onDateChange: (date: string) => void;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  date,
  onDateChange,
  className,
  placeholder = "mm/dd/yyyy",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Convert string date to Date object for the calendar
  const selectedDate = useMemo(() => {
    try {
      return date ? parse(date, "yyyy-MM-dd", new Date()) : undefined;
    } catch {
      return undefined;
    }
  }, [date]);

  // Format display value for input
  const displayDate = useMemo(() => {
    if (isFocused) return inputValue;
    try {
      const parsedDate = parse(date, "yyyy-MM-dd", new Date());
      return isValid(parsedDate) ? format(parsedDate, "MM/dd/yyyy") : "";
    } catch {
      return "";
    }
  }, [date, inputValue, isFocused]);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onDateChange(format(selectedDate, "yyyy-MM-dd"));
      setInputValue("");
      setIsOpen(false);
    }
  };

  // Parse user input and update date
  const parseAndUpdateDate = (input: string) => {
    if (!input.trim()) return;

    try {
      // Try parsing MM/dd/yyyy format
      let parsedDate = parse(input, "MM/dd/yyyy", new Date());

      // If that fails, try other common formats
      if (!isValid(parsedDate)) {
        parsedDate = parse(input, "M/d/yyyy", new Date());
      }
      if (!isValid(parsedDate)) {
        parsedDate = parse(input, "yyyy-MM-dd", new Date());
      }

      if (isValid(parsedDate)) {
        const formattedDate = format(parsedDate, "yyyy-MM-dd");
        onDateChange(formattedDate);
        setInputValue("");
      }
    } catch {
      // Invalid date - reset input
      setInputValue("");
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    // Initialize with current formatted value
    if (date) {
      try {
        const parsedDate = parse(date, "yyyy-MM-dd", new Date());
        if (isValid(parsedDate)) {
          setInputValue(format(parsedDate, "MM/dd/yyyy"));
        }
      } catch {
        setInputValue("");
      }
    } else {
      setInputValue("");
    }
  };

  const handleInputBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    parseAndUpdateDate(e.target.value);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      parseAndUpdateDate((e.target as HTMLInputElement).value);
      (e.target as HTMLInputElement).blur();
    }
  };

  // Handle input change with auto-formatting
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    setInputValue(formatted);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            type="button"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <div className="relative">
        <input
          type="text"
          value={displayDate}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          className="h-8 w-24 px-2 py-1 text-sm bg-muted border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <div className="absolute inset-0 flex items-center px-2 pointer-events-none text-sm z-10">
          {isFocused && displayDate.length > 0 && displayDate.length < 10 && (
            <>
              <span className="opacity-0">{displayDate}</span>
              <span className="text-muted-foreground opacity-60">{placeholder.slice(displayDate.length)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
