import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  label: string;
  value?: string; // Format YYYY-MM-DD
  onChange: (date: string) => void;
  error?: string;
  required?: boolean;
  id?: string;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DatePicker: React.FC<DatePickerProps> = ({ 
  label, 
  value, 
  onChange, 
  error,
  required,
  id 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial value or use today
  const initialDate = value ? new Date(value + 'T12:00:00') : new Date();
  
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  
  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    // Format to YYYY-MM-DD
    const formatted = date.toISOString().split('T')[0];
    onChange(formatted);
    setIsOpen(false);
    setIsFocused(false);
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00'); // T12:00:00 avoids timezone issues
    return date.toLocaleDateString('pt-BR');
  };

  const { days, firstDay } = getDaysInMonth(currentMonth);
  const selectedDate = value ? new Date(value + 'T12:00:00') : null;

  return (
    <div className="flex flex-col gap-1.5 relative" ref={containerRef}>
      <label 
        htmlFor={id} 
        className={`text-sm font-medium transition-colors duration-200 ${
          error ? 'text-status-error' : isFocused ? 'text-primary' : 'text-text-primary'
        }`}
      >
        {label}
      </label>
      
      <div 
        className="relative group cursor-pointer"
        onClick={() => {
          setIsOpen(!isOpen);
          setIsFocused(!isOpen);
        }}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
          <CalendarIcon size={20} className={`${isFocused ? 'text-primary' : 'text-text-secondary'} transition-colors duration-200`} />
        </div>
        
        <input
          id={id}
          type="text"
          readOnly
          value={formatDateDisplay(value)}
          placeholder="Selecione uma data"
          onInvalid={(e) => {
            e.preventDefault();
            // Previne a mensagem padrão do HTML5 - validação será feita no submit do formulário
          }}
          className={`
            w-full h-[48px] rounded-custom border bg-white px-4 pl-10 transition-all duration-200
            placeholder:text-text-disabled text-text-primary outline-none cursor-pointer
            ${error 
              ? 'border-status-error focus:border-status-error focus:ring-1 focus:ring-status-error' 
              : 'border-border hover:border-primary-light focus:border-primary focus:ring-2 focus:ring-primary/20'
            }
            ${isFocused ? 'border-primary ring-2 ring-primary/20' : ''}
          `}
        />
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-[80px] left-0 z-50 bg-white rounded-custom shadow-xl border border-border p-4 w-[320px] animate-in fade-in zoom-in-95 duration-200">
          
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={handlePrevMonth}
              className="p-1 hover:bg-surface rounded-full text-text-secondary hover:text-primary transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-semibold text-text-primary">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1 hover:bg-surface rounded-full text-text-secondary hover:text-primary transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Week days */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="text-center text-xs font-medium text-text-secondary py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const isSelected = selectedDate && 
                selectedDate.getDate() === day && 
                selectedDate.getMonth() === currentMonth.getMonth() && 
                selectedDate.getFullYear() === currentMonth.getFullYear();
              
              const isToday = 
                new Date().getDate() === day &&
                new Date().getMonth() === currentMonth.getMonth() &&
                new Date().getFullYear() === currentMonth.getFullYear();

              return (
                <button
                  key={day}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDateClick(day);
                  }}
                  className={`
                    h-9 w-9 rounded-full text-sm flex items-center justify-center transition-all
                    ${isSelected 
                      ? 'bg-primary text-white shadow-md' 
                      : 'text-text-primary hover:bg-surface hover:text-primary'
                    }
                    ${!isSelected && isToday ? 'border border-primary text-primary font-semibold' : ''}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <span className="text-xs text-status-error mt-0.5 animate-pulse">
          {error}
        </span>
      )}
    </div>
  );
};

export default DatePicker;