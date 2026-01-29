import { useMemo, useState, useRef } from "react";
import type { KeyboardEvent, FocusEvent, ChangeEvent } from "react";
import { Button } from "./Button";
import { Calendar } from "./Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn, formatDateInput } from "../../lib/utils";

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
  const [startFocused, setStartFocused] = useState(false);
  const [endFocused, setEndFocused] = useState(false);
  const selectionCountRef = useRef(0);
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
    if (startFocused) return startInputValue;
    try {
      const date = parse(startDate, "yyyy-MM-dd", new Date());
      return isValid(date) ? format(date, "MM/dd/yyyy") : "";
    } catch {
      return "";
    }
  }, [startDate, startInputValue, startFocused]);

  const displayEndDate = useMemo(() => {
    if (endFocused) return endInputValue;
    try {
      const date = parse(endDate, "yyyy-MM-dd", new Date());
      return isValid(date) ? format(date, "MM/dd/yyyy") : "";
    } catch {
      return "";
    }
  }, [endDate, endInputValue, endFocused]);

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) return;

    // Increment selection count
    selectionCountRef.current += 1;

    // Update the dates
    if (range.from && range.to) {
      // Both dates selected
      onDateChange({
        startDate: format(range.from, "yyyy-MM-dd"),
        endDate: format(range.to, "yyyy-MM-dd"),
      });
      setStartInputValue("");
      setEndInputValue("");

      // Only close if we've had 2 selections (user clicked twice)
      if (selectionCountRef.current >= 2) {
        setIsOpen(false);
      }
    } else if (range.from) {
      // Only start date selected
      onDateChange({
        startDate: format(range.from, "yyyy-MM-dd"),
        endDate: "",
      });
      setStartInputValue("");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Reset selection count when opening
      selectionCountRef.current = 0;
    }
    setIsOpen(open);
  };

  // Parse user input and update date
  const parseAndUpdateDate = (input: string, isStartDate: boolean) => {
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

  const handleStartInputFocus = () => {
    setStartFocused(true);
    // Initialize with current formatted value
    if (startDate) {
      try {
        const date = parse(startDate, "yyyy-MM-dd", new Date());
        if (isValid(date)) {
          setStartInputValue(format(date, "MM/dd/yyyy"));
        }
      } catch {
        setStartInputValue("");
      }
    } else {
      setStartInputValue("");
    }
  };

  const handleStartInputBlur = (e: FocusEvent<HTMLInputElement>) => {
    setStartFocused(false);
    parseAndUpdateDate(e.target.value, true);
  };

  const handleEndInputFocus = () => {
    setEndFocused(true);
    // Initialize with current formatted value
    if (endDate) {
      try {
        const date = parse(endDate, "yyyy-MM-dd", new Date());
        if (isValid(date)) {
          setEndInputValue(format(date, "MM/dd/yyyy"));
        }
      } catch {
        setEndInputValue("");
      }
    } else {
      setEndInputValue("");
    }
  };

  const handleEndInputBlur = (e: FocusEvent<HTMLInputElement>) => {
    setEndFocused(false);
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

  // Handle input change with auto-formatting
  const handleStartInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    setStartInputValue(formatted);
  };

  const handleEndInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    setEndInputValue(formatted);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 px-3" type="button">
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
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

      <div className="relative">
        <input
          type="text"
          value={displayStartDate}
          onChange={handleStartInputChange}
          onFocus={handleStartInputFocus}
          onBlur={handleStartInputBlur}
          onKeyDown={handleStartInputKeyDown}
          placeholder="mm/dd/yyyy"
          className="h-9 w-28 px-2 py-1.5 text-sm bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <div className="absolute inset-0 flex items-center px-2 pointer-events-none text-sm z-10">
          {startFocused && displayStartDate.length > 0 && displayStartDate.length < 10 && (
            <>
              <span className="opacity-0">{displayStartDate}</span>
              <span className="text-muted-foreground opacity-60">
                {"mm/dd/yyyy".slice(displayStartDate.length)}
              </span>
            </>
          )}
        </div>
      </div>

      <span className="text-muted-foreground">-</span>

      <div className="relative">
        <input
          ref={endInputRef}
          type="text"
          value={displayEndDate}
          onChange={handleEndInputChange}
          onFocus={handleEndInputFocus}
          onBlur={handleEndInputBlur}
          onKeyDown={handleEndInputKeyDown}
          placeholder="mm/dd/yyyy"
          className="h-9 w-28 px-2 py-1.5 text-sm bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <div className="absolute inset-0 flex items-center px-2 pointer-events-none text-sm z-10">
          {endFocused && displayEndDate.length > 0 && displayEndDate.length < 10 && (
            <>
              <span className="opacity-0">{displayEndDate}</span>
              <span className="text-muted-foreground opacity-60">
                {"mm/dd/yyyy".slice(displayEndDate.length)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
