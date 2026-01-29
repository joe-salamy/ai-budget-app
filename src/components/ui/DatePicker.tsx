import { useMemo, useState } from "react";
import type { KeyboardEvent, FocusEvent } from "react";
import { Button } from "./Button";
import { Calendar } from "./Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "../../lib/utils";

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
  placeholder = "1/28/2026",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

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
    if (inputValue) return inputValue;
    try {
      const parsedDate = parse(date, "yyyy-MM-dd", new Date());
      return isValid(parsedDate) ? format(parsedDate, "M/d/yyyy") : "";
    } catch {
      return "";
    }
  }, [date, inputValue]);

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
      // Try parsing M/d/yyyy format
      let parsedDate = parse(input, "M/d/yyyy", new Date());

      // If that fails, try other common formats
      if (!isValid(parsedDate)) {
        parsedDate = parse(input, "MM/dd/yyyy", new Date());
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

  const handleInputBlur = (e: FocusEvent<HTMLInputElement>) => {
    parseAndUpdateDate(e.target.value);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      parseAndUpdateDate((e.target as HTMLInputElement).value);
      (e.target as HTMLInputElement).blur();
    }
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

      <input
        type="text"
        value={displayDate}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        className="h-8 w-24 px-2 py-1 text-sm bg-muted border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
      />
    </div>
  );
}
