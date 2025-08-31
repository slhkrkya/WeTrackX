'use client';

import { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Önceden tanımlanmış renkler
const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#EC4899', '#F43F5E',
  '#6B7280', '#374151', '#1F2937', '#111827', '#FFFFFF', '#F3F4F6', '#E5E7EB', '#D1D5DB'
];

function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

export default function ColorPicker({ 
  value, 
  onChange, 
  placeholder = "#000000",
  className = "",
  disabled = false 
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Input değeri değiştiğinde validation yap
  useEffect(() => {
    setInputValue(value);
    setIsValid(!value || isValidHexColor(value));
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

  const handleColorSelect = (color: string) => {
    onChange(color);
    setInputValue(color);
    setIsValid(true);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (!newValue) {
      setIsValid(true);
      onChange('');
      return;
    }

    const valid = isValidHexColor(newValue);
    setIsValid(valid);
    
    if (valid) {
      onChange(newValue.toUpperCase());
    }
  };

  const handleInputBlur = () => {
    if (!isValid && inputValue) {
      setInputValue(value);
      setIsValid(true);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Ana renk seçici */}
      <div className="flex items-center gap-3">
        {/* Renk önizleme butonu */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            relative w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-600 
            shadow-sm transition-all duration-200 hover:shadow-md
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
            ${!isValid ? 'border-red-300 dark:border-red-600' : ''}
          `}
          style={{ 
            background: value || '#FFFFFF',
            borderColor: !isValid ? '#FCA5A5' : undefined
          }}
          title="Renk seç"
        >
          {/* Renk yoksa placeholder */}
          {!value && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            </div>
          )}
          
          {/* Seçim göstergesi */}
          {isOpen && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>

        {/* Hex input */}
        <div className="flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full px-3 py-2 border rounded-lg font-mono text-sm uppercase
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all duration-200
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${!isValid ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-600'}
            `}
          />
        </div>
      </div>

      {/* Renk paleti dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            {/* Başlık */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Renk Seç</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Önceden tanımlanmış renkler */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Hazır Renkler</h4>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`
                      w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-600
                      hover:scale-110 hover:shadow-md transition-all duration-200
                      ${value === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                    `}
                    style={{ background: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Özel renk seçici */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Özel Renk</h4>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={value || '#000000'}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-600 cursor-pointer"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Renk tekerleğini kullanarak özel renk seçin
                </span>
              </div>
            </div>

            {/* Geçersiz renk uyarısı */}
            {!isValid && inputValue && (
              <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs text-red-600 dark:text-red-400">
                  Geçerli bir HEX renk girin (örn: #22C55E)
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
