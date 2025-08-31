'use client';
import LogoLoading from './LogoLoading';

type LoadingScreenProps = {
  message?: string;
  size?: number;
};

export default function LoadingScreen({ 
  message = "Yükleniyor...", 
  size = 128 
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 p-8">
        <LogoLoading size={size} />
        <p className="text-muted-600 dark:text-muted-400 font-medium">
          {message}
        </p>
      </div>
    </div>
  );
}
