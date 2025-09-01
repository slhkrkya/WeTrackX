'use client';
import { useState, useEffect } from 'react';
import LogoLoading from './LogoLoading';

interface SuspenseFallbackProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
  timeout?: number;
  onTimeout?: () => void;
  showRetry?: boolean;
}

export default function SuspenseFallback({ 
  message = "Yükleniyor...", 
  size = 64,
  fullScreen = false,
  timeout = 30000, // 30 saniye
  onTimeout,
  showRetry = true
}: SuspenseFallbackProps) {
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimedOut(true);
      onTimeout?.();
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout, onTimeout]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIsTimedOut(false);
    onTimeout?.();
  };

  const content = (
    <div className="flex flex-col items-center gap-4 p-8">
      {!isTimedOut ? (
        <>
          <LogoLoading size={size} />
          <p className="text-sm text-muted-600 dark:text-muted-400 font-medium">
            {message}
          </p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
              Yükleme zaman aşımına uğradı
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Sayfa yüklenirken bir sorun oluştu
            </p>
            {showRetry && (
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Tekrar Dene {retryCount > 0 && `(${retryCount})`}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      {content}
    </div>
  );
}
