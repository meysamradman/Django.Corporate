import { useState, useEffect } from "react";
import { Button } from "@/components/elements/Button";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isAfter,
  isBefore,
  isWithinInterval,
  startOfDay,
  endOfDay
} from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/elements/Popover";
import { cn } from "@/core/utils/cn";

interface PersianDateRangePickerProps {
  value?: { from?: string; to?: string };
  onChange?: (value: { from?: string; to?: string }) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PersianDateRangePicker({
  value,
  onChange,
  placeholder = "",
  disabled = false,
  className = ""
}: PersianDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [leftMonth, setLeftMonth] = useState(new Date());
  const [rightMonth, setRightMonth] = useState(addMonths(new Date(), 1));
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  useEffect(() => {
    if (value) {
      if (value.from) {
        const from = new Date(value.from);
        if (!isNaN(from.getTime())) {
          setStartDate(from);
          setLeftMonth(from);
          setRightMonth(addMonths(from, 1));
        }
      } else {
        setStartDate(null);
      }

      if (value.to) {
        const to = new Date(value.to);
        if (!isNaN(to.getTime())) {
          setEndDate(to);
        }
      } else {
        setEndDate(null);
      }
    } else {
      setStartDate(null);
      setEndDate(null);
    }
  }, [value]);

  const handleDateClick = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(date);
      setEndDate(null);
      setHoverDate(null);
    } else if (startDate && !endDate) {
      // Complete selection
      if (isBefore(date, startDate)) {
        // If clicked date is before start, swap them
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
      setHoverDate(null);
    }
  };

  const handleDateHover = (date: Date) => {
    if (startDate && !endDate) {
      setHoverDate(date);
    }
  };

  const clearSelection = () => {
    setStartDate(null);
    setEndDate(null);
    setHoverDate(null);
    if (onChange) {
      onChange({ from: undefined, to: undefined });
    }
  };

  const applySelection = () => {
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (startDate && endDate && onChange) {
      onChange({
        from: formatDate(startDate),
        to: formatDate(endDate)
      });
    } else if (startDate && onChange) {
      onChange({
        from: formatDate(startDate),
        to: undefined
      });
    }
    setOpen(false);
  };


  const formatJalaliDate = (date: Date): string => {
    try {
      const day = format(date, 'd', { locale: faIR });
      const month = format(date, 'MMMM', { locale: faIR });
      const year = format(date, 'yyyy', { locale: faIR });
      return `${day} ${month} ${year}`;
    } catch {
      return "";
    }
  };

  const getDisplayText = () => {
    if (startDate && endDate) {
      return `${formatJalaliDate(startDate)} - ${formatJalaliDate(endDate)}`;
    } else if (startDate) {
      return `از ${formatJalaliDate(startDate)}`;
    }
    return placeholder;
  };

  const renderCalendar = (month: Date, isLeft: boolean) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const persianMonthName = format(month, 'MMMM', { locale: faIR });
    const persianYear = format(month, 'yyyy', { locale: faIR });
    const weekdayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

    // Get first day of month weekday
    // In Jalali: Saturday = 0, Sunday = 1, ..., Friday = 6
    const firstDayWeekday = monthStart.getDay();
    // Adjust for RTL: Persian week starts with Saturday (ش)
    // getDay() returns: 0=Saturday, 1=Sunday, ..., 6=Friday
    // We need: 0=Saturday (ش), 1=Sunday (ی), ..., 6=Friday (ج)
    const adjustedFirstDay = firstDayWeekday;

    // Get previous month's last days to fill the grid
    const prevMonth = subMonths(month, 1);
    const prevMonthEnd = endOfMonth(prevMonth);
    const prevMonthDays = eachDayOfInterval({
      start: startOfMonth(prevMonth),
      end: prevMonthEnd
    });

    // Get next month's first days to fill the grid
    const nextMonth = addMonths(month, 1);
    const nextMonthStart = startOfMonth(nextMonth);
    const nextMonthDays = eachDayOfInterval({
      start: nextMonthStart,
      end: addMonths(nextMonthStart, 1)
    });

    // Build calendar grid: 6 rows × 7 columns = 42 days
    const allDays: Date[] = [];

    // Add previous month's trailing days
    if (adjustedFirstDay > 0) {
      const trailingDays = prevMonthDays.slice(-adjustedFirstDay);
      allDays.push(...trailingDays);
    }

    // Add current month's days
    allDays.push(...days);

    // Add next month's leading days to complete 42 days
    const remainingDays = 42 - allDays.length;
    if (remainingDays > 0) {
      const leadingDays = nextMonthDays.slice(0, remainingDays);
      allDays.push(...leadingDays);
    }

    const isDateInRange = (date: Date) => {
      if (!startDate) return false;

      if (startDate && endDate) {
        return isWithinInterval(date, {
          start: startOfDay(startDate),
          end: endOfDay(endDate)
        });
      }

      if (startDate && hoverDate) {
        const rangeStart = isBefore(startDate, hoverDate) ? startDate : hoverDate;
        const rangeEnd = isAfter(startDate, hoverDate) ? startDate : hoverDate;
        return isWithinInterval(date, {
          start: startOfDay(rangeStart),
          end: endOfDay(rangeEnd)
        });
      }

      return false;
    };

    const isDateStart = (date: Date) => {
      return startDate && isSameDay(date, startDate);
    };

    const isDateEnd = (date: Date) => {
      return endDate && isSameDay(date, endDate);
    };

    const isDateInCurrentMonth = (date: Date) => {
      return isSameMonth(date, month);
    };

    return (
      <div className="w-full">
        {/* Month Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-input">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (isLeft) {
                  setLeftMonth(subMonths(leftMonth, 1));
                } else {
                  setRightMonth(subMonths(rightMonth, 1));
                }
              }}
              disabled={disabled}
              className="h-7 w-7"
              type="button"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-1.5 min-w-[120px] justify-center">
              <span className="font-medium text-sm text-font-p">{persianMonthName}</span>
              <span className="font-medium text-sm text-font-p">/</span>
              <span className="font-medium text-sm text-font-p">{persianYear}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (isLeft) {
                  setLeftMonth(addMonths(leftMonth, 1));
                } else {
                  setRightMonth(addMonths(rightMonth, 1));
                }
              }}
              disabled={disabled}
              className="h-7 w-7"
              type="button"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-0.5 px-2 pt-2">
          {weekdayNames.map((day) => (
            <div
              key={day}
              className="text-center font-medium text-xs text-font-s py-1.5"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-0.5 p-2">
          {allDays.map((day, index) => {
            const isInRange = isDateInRange(day);
            const isStart = isDateStart(day);
            const isEnd = isDateEnd(day);
            const isCurrentMonth = isDateInCurrentMonth(day);
            const isToday = isSameDay(day, new Date());
            const dayNumber = format(day, 'd', { locale: faIR });

            return (
              <button
                key={`${day.getTime()}-${index}`}
                type="button"
                onClick={() => handleDateClick(day)}
                onMouseEnter={() => handleDateHover(day)}
                disabled={disabled || !isCurrentMonth}
                className={cn(
                  "h-8 w-8 text-xs rounded-md transition-all",
                  "flex items-center justify-center relative",
                  !isCurrentMonth && "opacity-30",
                  isInRange && !isStart && !isEnd && "bg-primary/10 text-font-p",
                  isStart && "bg-primary text-primary-foreground font-medium rounded-r-none",
                  isEnd && "bg-primary text-primary-foreground font-medium rounded-l-none",
                  isStart && isEnd && "rounded-md",
                  !isStart && !isEnd && isCurrentMonth && "hover:bg-bg hover:text-font-p",
                  isToday && !isStart && !isEnd && "border border-input font-medium",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {dayNumber}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <input
            type="text"
            value={getDisplayText()}
            placeholder={placeholder}
            readOnly
            disabled={disabled}
            className={cn(
              "flex h-9 rounded-md border border-input bg-card pr-3 pl-10 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-font-s focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
              className?.includes('w-') ? "" : "w-auto min-w-[120px]"
            )}
          />
          <div className="absolute left-0 top-0 h-full flex items-center justify-center px-2 pointer-events-none">
            <Calendar className="h-4 w-4 text-font-s" />
          </div>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
              className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded hover:bg-bg transition-colors"
            >
              <X className="h-3.5 w-3.5 text-font-s" />
            </button>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        className={cn(
          "w-auto p-0",
          "bg-card border rounded-lg shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2"
        )}
        dir="rtl"
      >
        <div className="flex gap-0 p-4">
          {/* Left Calendar */}
          <div className="w-[280px] border-l border-input pl-4">
            {renderCalendar(leftMonth, true)}
          </div>

          {/* Right Calendar */}
          <div className="w-[280px] pr-4">
            {renderCalendar(rightMonth, false)}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-3 border-t border-input">
          <Button
            variant="outline"
            size="sm"
            onClick={clearSelection}
            className="h-8 text-sm"
            type="button"
          >
            پاک کردن
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 text-sm"
              type="button"
            >
              انصراف
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={applySelection}
              disabled={!startDate}
              className="h-8 text-sm"
              type="button"
            >
              اعمال
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

