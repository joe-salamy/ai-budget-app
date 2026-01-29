import { useMemo, useState, useRef } from "react";
import type { KeyboardEvent, FocusEvent } from "react";
import { Button } from "./Button";
import { Calendar } from "./Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "../../lib/utils";

interface DateRangePickerProps {
  startDate: string; // yyyy-MM-dd format
  endDate: string; // yyyy-MM-dd format
  onDateChange: (range: { startDate: string; endDate: string }) => void;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startInputValue, setStartInputValue] = useState("");
  const [endInputValue, setEndInputValue] = useState("");
  const preventCloseRef = useRef(false);
  const endInputRef = useRef<HTMLInputElement>(null);

  // Convert string dates to Date objects for the calendar
  const dateRange: DateRange | undefined = useMemo(() => {
    try {
      const from = startDate ? parse(startDate, "yyyy-MM-dd", new Date()) : undefined;
      const to = endDate ? parse(endDate, "yyyy-MM-dd", new Date()) : undefined;
      // Return partial range if we have at least one date
      return from || to ? { from, to } : undefined;
    } catch {
      return undefined;
    }
  }, [startDate, endDate]);

  // Format display values for inputs
  const displayStartDate = useMemo(() => {
    if (startInputValue) return startInputValue;
    try {
      const date = parse(startDate, "yyyy-MM-dd", new Date());
      return isValid(date) ? format(date, "M/d/yyyy") : "";
    } catch {
      return "";
    }
  }, [startDate, startInputValue]);

  const displayEndDate = useMemo(() => {
    if (endInputValue) return endInputValue;
    try {
      const date = parse(endDate, "yyyy-MM-dd", new Date());
      return isValid(date) ? format(date, "M/d/yyyy") : "";
    } catch {
      return "";
    }
  }, [endDate, endInputValue]);

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) return;

    // If both dates are selected and they're different, update and close
    if (range.from && range.to && range.from.getTime() !== range.to.getTime()) {
      preventCloseRef.current = false;
      onDateChange({
        startDate: format(range.from, "yyyy-MM-dd"),
        endDate: format(range.to, "yyyy-MM-dd"),
      });
      setStartInputValue("");
      setEndInputValue("");
      setIsOpen(false);
    } else if (range.from) {
      // If only start date is selected (or both dates are the same), keep open
      preventCloseRef.current = true;
      onDateChange({
        startDate: format(range.from, "yyyy-MM-dd"),
        endDate: "", // Clear end date to indicate incomplete range
      });
      setStartInputValue("");
    }
  };

  const handleOpenChange = (open: boolean) => {
    // Prevent closing if we're in the middle of selecting a range
    if (!open && preventCloseRef.current) {
      return;
    }
    if (!open) {
      preventCloseRef.current = false;
    }
    setIsOpen(open);
  };

  // Parse user input and update date
  const parseAndUpdateDate = (input: string, isStartDate: boolean) => {
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
        if (isStartDate) {
          onDateChange({ startDate: formattedDate, endDate });
          setStartInputValue("");
        } else {
          onDateChange({ startDate, endDate: formattedDate });
          setEndInputValue("");
        }
      }
    } catch {
      // Invalid date - reset input
      if (isStartDate) {
        setStartInputValue("");
      } else {
        setEndInputValue("");
      }
    }
  };

  const handleStartInputBlur = (e: FocusEvent<HTMLInputElement>) => {
    parseAndUpdateDate(e.target.value, true);
  };

  const handleEndInputBlur = (e: FocusEvent<HTMLInputElement>) => {
    parseAndUpdateDate(e.target.value, false);
  };

  const handleStartInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      parseAndUpdateDate((e.target as HTMLInputElement).value, true);
      endInputRef.current?.focus();
    } else if (e.key === "Tab" && !e.shiftKey) {
      // Let Tab naturally focus the end input
    }
  };

  const handleEndInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      parseAndUpdateDate((e.target as HTMLInputElement).value, false);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-9 px-3"
            type="button"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          onInteractOutside={(e) => {
            if (preventCloseRef.current) {
              e.preventDefault();
            }
          }}
        >
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <input
        type="text"
        value={displayStartDate}
        onChange={(e) => setStartInputValue(e.target.value)}
        onBlur={handleStartInputBlur}
        onKeyDown={handleStartInputKeyDown}
        placeholder="1/28/2026"
        className="h-9 w-28 px-3 py-2 text-sm bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
      />

      <span className="text-muted-foreground">-</span>

      <input
        ref={endInputRef}
        type="text"
        value={displayEndDate}
        onChange={(e) => setEndInputValue(e.target.value)}
        onBlur={handleEndInputBlur}
        onKeyDown={handleEndInputKeyDown}
        placeholder="1/28/2026"
        className="h-9 w-28 px-3 py-2 text-sm bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
      />
    </div>
  );
}
