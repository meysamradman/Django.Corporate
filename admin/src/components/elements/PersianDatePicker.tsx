"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/elements/Button";
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { format, parse, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, setYear, getYear } from 'date-fns-jalali';
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
  const [yearRange, setYearRange] = useState({ start: 1300, end: 1420 }); // Persian years range
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    }
  }, [value]);

  // Close calendar when clicking outside
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
      setShowYearSelector(false); // Reset year selector when closing
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (onChange) {
      // Send date in ISO format (YYYY-MM-DD) for backend compatibility
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

  // Custom format function to remove "ام" from day
  const formatJalaliDate = (date: Date): string => {
    const day = format(date, 'd', { locale: faIR });
    const month = format(date, 'MMMM', { locale: faIR });
    const year = format(date, 'yyyy', { locale: faIR });
    return `${day} ${month} ${year}`;
  };

  const renderCalendar = () => {
    // Get the first day of the month and the last day of the month
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    // Get all days to display in the calendar (including days from previous/next months)
    const days = eachDayOfInterval({
      start: monthStart,
      end: monthEnd
    });
    
    // Get Persian month and year for display
    const persianMonthName = format(currentDate, 'MMMM', { locale: faIR });
    const persianYear = format(currentDate, 'yyyy', { locale: faIR });
    
    // Weekday names in Persian
    const weekdayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
    
    return (
      <div 
        ref={calendarRef}
        className="absolute top-full mt-1 right-0 bg-background border rounded-md shadow-lg z-50 w-80"
      >
        {/* Header with month/year navigation */}
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
              variant="ghost"
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
        
        {/* Year selector */}
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
        
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 p-2">
          {weekdayNames.map((day) => (
            <div key={day} className="text-center font-medium p-1 text-muted-foreground text-sm">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
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
                    ? "bg-primary text-primary-foreground" 
                    : isToday
                      ? "bg-accent text-accent-foreground border border-accent"
                      : isCurrentMonth
                        ? "hover:bg-accent"
                        : "text-muted-foreground"
                }`}
                onClick={() => handleDateSelect(day)}
                disabled={disabled || !isCurrentMonth}
              >
                {format(day, 'd', { locale: faIR })}
              </button>
            );
          })}
        </div>
        
        {/* Today button */}
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
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer md:text-sm"
        />
        <Button
          variant="ghost"
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