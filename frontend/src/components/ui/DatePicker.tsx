'use client';

import { useState, useRef, useEffect } from 'react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  type?: 'date' | 'datetime-local';
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  showTime?: boolean;
}

// Hızlı tarih seçenekleri
const QUICK_DATES = [
  { label: 'Bugün', value: 'today' },
  { label: 'Dün', value: 'yesterday' },
  { label: 'Bu Hafta', value: 'this-week' },
  { label: 'Geçen Hafta', value: 'last-week' },
  { label: 'Bu Ay', value: 'this-month' },
  { label: 'Geçen Ay', value: 'last-month' },
];

function getQuickDateValue(type: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (type) {
    case 'today':
      return today.toISOString().split('T')[0];
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    case 'this-week':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return startOfWeek.toISOString().split('T')[0];
    case 'last-week':
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - today.getDay() - 7);
      return lastWeek.toISOString().split('T')[0];
    case 'this-month':
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    case 'last-month':
      return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    default:
      return '';
  }
}

function formatDateForDisplay(dateString: string, type: 'date' | 'datetime-local'): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (type === 'date') {
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      return date.toLocaleString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch {
    return dateString;
  }
}

export default function DatePicker({ 
  value, 
  onChange, 
  type = 'date',
  placeholder = "Tarih seçin",
  className = "",
  disabled = false,
  min,
  max,
  showTime = false
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Input değeri değiştiğinde güncelle
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Dışarı tıklandığında dropdown'ı kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (date: string, closeDropdown = false) => {
    onChange(date);
    setInputValue(date);
    if (closeDropdown) {
      setIsOpen(false);
    }
  };

  const handleQuickDateSelect = (quickType: string) => {
    const dateValue = getQuickDateValue(quickType);
    if (dateValue) {
      // Hızlı tarih seçiminde dropdown'ı kapatma, sadece tarihi güncelle
      const timePart = inputValue.includes('T') ? inputValue.split('T')[1] : getCurrentTime();
      const newDateTime = `${dateValue}T${timePart}`;
      handleDateSelect(newDateTime, false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const getTodayString = () => {
    const now = new Date();
    if (type === 'date') {
      return now.toISOString().split('T')[0];
    } else {
      return now.toISOString().slice(0, 16);
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Ana tarih seçici */}
      <div className="flex items-center gap-3">
        {/* Tarih önizleme butonu */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            relative w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-600 
            shadow-sm transition-all duration-200 hover:shadow-md
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
            bg-white dark:bg-gray-700
          `}
          title="Tarih seç"
        >
                     {/* Tarih ikonu */}
           <div className="absolute inset-0 flex items-center justify-center">
             <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
             </svg>
           </div>
          
          {/* Seçim göstergesi */}
          {isOpen && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>

        {/* Tarih input */}
        <div className="flex-1">
          <input
            type={type}
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            className={`
              w-full px-3 py-2 border rounded-lg text-sm
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all duration-200
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              border-gray-200 dark:border-gray-600
              [&::-webkit-calendar-picker-indicator]:hidden
              [&::-webkit-inner-spin-button]:hidden
              [&::-webkit-outer-spin-button]:hidden
            `}
          />
        </div>
      </div>

      {/* Tarih paleti dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            {/* Başlık */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Tarih Seç</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Hızlı tarih seçenekleri */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Hızlı Seçim</h4>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_DATES.map((quickDate) => (
                  <button
                    key={quickDate.value}
                    type="button"
                    onClick={() => handleQuickDateSelect(quickDate.value)}
                    className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                  >
                    {quickDate.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Manuel tarih seçici */}
             <div>
               <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Manuel Seçim</h4>
               <div className="space-y-3">
                 <input
                   type="date"
                   value={inputValue.includes('T') ? inputValue.split('T')[0] : inputValue}
                   onChange={(e) => {
                     const timePart = inputValue.includes('T') ? inputValue.split('T')[1] : getCurrentTime();
                     const newDateTime = `${e.target.value}T${timePart}`;
                     handleDateSelect(newDateTime, false);
                   }}
                   min={min}
                   max={max}
                   className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                 />
                 
                 {/* Bugün butonu */}
                 <button
                   type="button"
                   onClick={() => handleDateSelect(getTodayString(), false)}
                   className="w-full px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200"
                 >
                   Bugünü Seç
                 </button>

                 {/* Saat seçimi (datetime-local için) */}
                 {(type === 'datetime-local' || showTime) && (
                   <div className="space-y-2">
                     <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Saat</h5>
                     <div className="flex gap-2">
                       <input
                         type="time"
                         value={inputValue.includes('T') ? inputValue.split('T')[1] : getCurrentTime()}
                         onChange={(e) => {
                           const datePart = inputValue.includes('T') ? inputValue.split('T')[0] : getTodayString();
                           const newDateTime = `${datePart}T${e.target.value}`;
                           handleDateSelect(newDateTime, false);
                         }}
                         className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                       />
                       <button
                         type="button"
                         onClick={() => {
                           const datePart = inputValue.includes('T') ? inputValue.split('T')[0] : getTodayString();
                           const newDateTime = `${datePart}T${getCurrentTime()}`;
                           handleDateSelect(newDateTime, false);
                         }}
                         className="px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200"
                       >
                         Şimdi
                       </button>
                     </div>
                   </div>
                 )}
               </div>
             </div>

            {/* Seçili tarih gösterimi */}
            {value && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Seçili Tarih</h4>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDateForDisplay(value, type)}
                </p>
              </div>
            )}

            {/* Tamam butonu */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
