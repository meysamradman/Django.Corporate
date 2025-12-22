import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/elements/Button";
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, setYear, getYear } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';

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
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [yearRange, setYearRange] = useState({ start: 1300, end: 1420 });
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowYearSelector(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleCalendar = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setShowYearSelector(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (onChange) {
      const isoDate = date.toISOString().split('T')[0];
      onChange(isoDate);
    }
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 12));
    } else {
      setCurrentDate(addMonths(currentDate, 12));
    }
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
    setSelectedDate(today);
    if (onChange) {
      const isoDate = today.toISOString().split('T')[0];
      onChange(isoDate);
    }
    setIsOpen(false);
  };

  const formatJalaliDate = (date: Date): string => {
    const day = format(date, 'd', { locale: faIR });
    const month = format(date, 'MMMM', { locale: faIR });
    const year = format(date, 'yyyy', { locale: faIR });
    return `${day} ${month} ${year}`;
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    const days = eachDayOfInterval({
      start: monthStart,
      end: monthEnd
    });
    
    const persianMonthName = format(currentDate, 'MMMM', { locale: faIR });
    const persianYear = format(currentDate, 'yyyy', { locale: faIR });
    
    const weekdayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
    
    return (
      <div 
        ref={calendarRef}
        className="absolute top-full mt-1 right-0 bg-card border rounded-md shadow-lg z-50 w-80"
      >
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateYear('prev')}
              disabled={disabled}
              className="h-8 w-8"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('prev')}
              disabled={disabled}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleYearSelector}
              className="font-medium px-2"
            >
              {persianYear}
            </Button>
            <span className="font-medium">/</span>
            <span className="font-medium px-2">{persianMonthName}</span>
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('next')}
              disabled={disabled}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateYear('next')}
              disabled={disabled}
              className="h-8 w-8"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {showYearSelector && (
          <div className="grid grid-cols-4 gap-2 p-3 border-b max-h-60 overflow-y-auto">
            {Array.from({ length: 16 }, (_, i) => yearRange.start + i).map((year) => (
              <Button
                key={year}
                variant={getYear(currentDate) === year ? "default" : "outline"}
                size="sm"
                onClick={() => selectYear(year)}
                className="h-10"
              >
                {year}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setYearRange({ start: yearRange.start - 16, end: yearRange.end - 16 })}
              className="h-10"
            >
              &lt;&lt;
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setYearRange({ start: yearRange.start + 16, end: yearRange.end + 16 })}
              className="h-10"
            >
              &gt;&gt;
            </Button>
          </div>
        )}
        
        <div className="grid grid-cols-7 gap-1 p-2">
          {weekdayNames.map((day) => (
            <div key={day} className="text-center font-medium p-1 text-font-s text-sm">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 p-2">
          {days.map((day, index) => {
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <button
                key={index}
                className={`p-2 text-center rounded-md text-sm h-10 w-10 ${
                  isSelected 
                    ? "bg-primary text-static-w" 
                    : isToday
                      ? "bg-bg text-font-p border"
                      : isCurrentMonth
                        ? "hover:bg-bg"
                        : "text-font-s"
                }`}
                onClick={() => handleDateSelect(day)}
                disabled={disabled || !isCurrentMonth}
              >
                {format(day, 'd', { locale: faIR })}
              </button>
            );
          })}
        </div>
        
        <div className="p-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="w-full"
          >
            امروز
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <div className={`relative ${className}`}>
        <input
          type="text"
          value={selectedDate ? formatJalaliDate(selectedDate) : ""}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          onClick={toggleCalendar}
          className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-font-s focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer md:text-sm"
        />
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-0 h-full"
          onClick={toggleCalendar}
          disabled={disabled}
        >
          <Calendar className="h-4 w-4" />
        </Button>
      </div>
      {isOpen && renderCalendar()}
    </div>
  );
}