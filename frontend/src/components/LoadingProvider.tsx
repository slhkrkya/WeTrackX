'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import LoadingScreen from './LoadingScreen';

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  setLoadingMessage: (message: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useGlobalLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a LoadingProvider');
  }
  return context;
}

interface LoadingProviderProps {
  children: ReactNode;
}

export default function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Yükleniyor...');

  const startLoading = useCallback((message?: string) => {
    if (message) {
      setLoadingMessage(message);
    }
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const updateLoadingMessage = useCallback((message: string) => {
    setLoadingMessage(message);
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingMessage,
        startLoading,
        stopLoading,
        setLoadingMessage: updateLoadingMessage,
      }}
    >
      {children}
      {isLoading && <LoadingScreen message={loadingMessage} />}
    </LoadingContext.Provider>
  );
}
