'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Hydration sorununu önlemek için
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
             <div className="relative w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse">
         <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full" />
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
             className={`
         relative w-12 h-6 rounded-full transition-all duration-300 ease-in-out
         ${isDark 
           ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25' 
           : 'bg-gradient-to-r from-gray-300 to-gray-400 shadow-lg shadow-gray-300/25'
         }
         hover:scale-105 active:scale-95
       `}
      aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
    >
      {/* Switch Track */}
      <div className="absolute inset-0 rounded-full bg-white/20 backdrop-blur-sm" />
      
      {/* Switch Thumb */}
             <div 
         className={`
           absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ease-in-out
           ${isDark ? 'left-6.5' : 'left-0.5'}
           bg-white shadow-lg
           flex items-center justify-center
         `}
      >
        {/* İkon Container */}
        <div className="relative w-3 h-3">
          {/* Güneş İkonu (Light Mode) */}
          <svg 
            className={`
              absolute inset-0 w-3 h-3 transition-all duration-300 ease-in-out
              ${isDark 
                ? 'text-yellow-500 opacity-100 scale-100 rotate-0' 
                : 'text-gray-400 opacity-0 scale-50 -rotate-90'
              }
            `}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
            />
          </svg>
          
          {/* Ay İkonu (Dark Mode) */}
          <svg 
            className={`
              absolute inset-0 w-3 h-3 transition-all duration-300 ease-in-out
              ${isDark 
                ? 'text-blue-600 opacity-0 scale-50 rotate-90' 
                : 'text-gray-600 opacity-100 scale-100 rotate-0'
              }
            `}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
            />
          </svg>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 rounded-full bg-transparent hover:bg-white/10 transition-colors duration-200" />
    </button>
  );
}
