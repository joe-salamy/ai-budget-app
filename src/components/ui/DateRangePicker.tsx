import { useMemo } from "react";
import { Button } from "./Button";
import { Calendar } from "./Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { format, parse } from "date-fns";
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
  // Convert string dates to Date objects for the calendar
  const dateRange: DateRange | undefined = useMemo(() => {
    try {
      const from = startDate ? parse(startDate, "yyyy-MM-dd", new Date()) : undefined;
      const to = endDate ? parse(endDate, "yyyy-MM-dd", new Date()) : undefined;
      return from && to ? { from, to } : undefined;
    } catch {
      return undefined;
    }
  }, [startDate, endDate]);

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      onDateChange({
        startDate: format(range.from, "yyyy-MM-dd"),
        endDate: format(range.to, "yyyy-MM-dd"),
      });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal px-3 py-2 h-auto text-sm",
            !dateRange && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "MMM dd, yyyy")} -{" "}
                {format(dateRange.to, "MMM dd, yyyy")}
              </>
            ) : (
              format(dateRange.from, "MMM dd, yyyy")
            )
          ) : (
            <span>Pick a date range</span>
          )}
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
  );
}
