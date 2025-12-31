import { useState, useEffect } from "react";
import { Button } from "@/components/elements/Button";
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, setYear, getYear } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/elements/Popover";
import { cn } from "@/core/utils/cn";

interface PersianDatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PersianDatePicker({
  value,
  onChange,
  placeholder = "تاریخ را انتخاب کنید",
  disabled = false,
  className = ""
}: PersianDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [yearRange, setYearRange] = useState({ start: 1300, end: 1420 });

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setCurrentDate(date);
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (onChange) {
      const isoDate = date.toISOString().split('T')[0];
      onChange(isoDate);
    }
    setOpen(false);
    setShowYearSelector(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
    setShowYearSelector(false);
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 12));
    } else {
      setCurrentDate(addMonths(currentDate, 12));
    }
    setShowYearSelector(false);
  };

  const toggleYearSelector = () => {
    setShowYearSelector(!showYearSelector);
  };

  const selectYear = (year: number) => {
    const newDate = setYear(currentDate, year);
    setCurrentDate(newDate);
    setShowYearSelector(false);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    handleDateSelect(today);
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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get previous month's last days
  const prevMonth = subMonths(currentDate, 1);
  const prevMonthEnd = endOfMonth(prevMonth);
  const prevMonthDays = eachDayOfInterval({
    start: startOfMonth(prevMonth),
    end: prevMonthEnd
  });
  
  // Get next month's first days
  const nextMonth = addMonths(currentDate, 1);
  const nextMonthStart = startOfMonth(nextMonth);
  const nextMonthDays = eachDayOfInterval({
    start: nextMonthStart,
    end: addMonths(nextMonthStart, 1)
  });
  
  // Get first day weekday (0 = Saturday, 6 = Friday)
  const firstDayWeekday = monthStart.getDay();
  
  // Build calendar grid: 6 rows × 7 columns = 42 days
  const allDays: Date[] = [];
  
  // Add previous month's trailing days
  if (firstDayWeekday > 0) {
    const trailingDays = prevMonthDays.slice(-firstDayWeekday);
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
  
  const persianMonthName = format(currentDate, 'MMMM', { locale: faIR });
  const persianYear = format(currentDate, 'yyyy', { locale: faIR });
  const weekdayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <input
            type="text"
            value={selectedDate ? formatJalaliDate(selectedDate) : ""}
            placeholder={placeholder}
            readOnly
            disabled={disabled}
            className="flex h-9 w-full rounded-md border border-input bg-card pr-3 pl-10 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-font-s focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          />
          <div className="absolute left-0 top-0 h-full flex items-center justify-center px-2 pointer-events-none">
            <Calendar className="h-4 w-4 text-font-s" />
          </div>
        </div>
      </PopoverTrigger>
      
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        className={cn(
          "w-auto min-w-[280px] max-w-[320px] p-0",
          "bg-card border rounded-lg shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2"
        )}
        dir="rtl"
      >
        {/* Header with month/year navigation */}
        <div className="flex items-center justify-between p-3 border-b border-input">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateYear('prev')}
              disabled={disabled}
              className="h-8 w-8"
              type="button"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('prev')}
              disabled={disabled}
              className="h-8 w-8"
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleYearSelector}
              className="font-medium px-3 h-8 text-sm"
              type="button"
            >
              {persianYear}
            </Button>
            <span className="font-medium text-font-p text-sm">/</span>
            <span className="font-medium text-font-p px-2 text-sm min-w-[60px] text-center">
              {persianMonthName}
            </span>
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('next')}
              disabled={disabled}
              className="h-8 w-8"
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateYear('next')}
              disabled={disabled}
              className="h-8 w-8"
              type="button"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Year Selector */}
        {showYearSelector && (
          <div className="grid grid-cols-4 gap-2 p-3 border-b border-input max-h-[240px] overflow-y-auto">
            {Array.from({ length: 16 }, (_, i) => yearRange.start + i).map((year) => {
              const currentYear = getYear(currentDate);
              return (
                <Button
                  key={year}
                  variant={currentYear === year ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectYear(year)}
                  className="h-9 text-sm"
                  type="button"
                >
                  {year}
                </Button>
              );
            })}
            <div className="col-span-4 flex gap-2 mt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setYearRange({ start: yearRange.start - 16, end: yearRange.end - 16 })}
                className="h-9 flex-1 text-sm"
                type="button"
              >
                &lt;&lt; قبلی
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setYearRange({ start: yearRange.start + 16, end: yearRange.end + 16 })}
                className="h-9 flex-1 text-sm"
                type="button"
              >
                بعدی &gt;&gt;
              </Button>
            </div>
          </div>
        )}
        
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 px-2 pt-2">
          {weekdayNames.map((day) => (
            <div
              key={day}
              className="text-center font-medium text-xs text-font-s py-2"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1 p-2">
          {allDays.map((day, index) => {
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const dayNumber = format(day, 'd', { locale: faIR });
            
            return (
              <button
                key={`${day.getTime()}-${index}`}
                type="button"
                onClick={() => handleDateSelect(day)}
                disabled={disabled || !isCurrentMonth}
                className={cn(
                  "h-9 w-9 text-sm rounded-md transition-colors",
                  "flex items-center justify-center",
                  isSelected
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : isToday
                      ? "bg-bg text-font-p border border-input font-medium"
                      : isCurrentMonth
                        ? "text-font-p hover:bg-bg hover:text-font-p"
                        : "text-font-s opacity-30 cursor-not-allowed",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {dayNumber}
              </button>
            );
          })}
        </div>
        
        {/* Today Button */}
        <div className="p-2 border-t border-input">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="w-full h-8 text-sm"
            type="button"
          >
            امروز
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}