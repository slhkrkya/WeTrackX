'use client';
import LogoLoading from './LogoLoading';

interface SuspenseFallbackProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
}

export default function SuspenseFallback({ 
  message = "Yükleniyor...", 
  size = 64,
  fullScreen = false 
}: SuspenseFallbackProps) {
  const content = (
    <div className="flex flex-col items-center gap-4 p-8">
      <LogoLoading size={size} />
      <p className="text-sm text-muted-600 dark:text-muted-400 font-medium">
        {message}
      </p>
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
