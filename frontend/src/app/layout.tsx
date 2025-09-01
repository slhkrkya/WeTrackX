import AppShell from '@/components/AppShell';
import './globals.css';
import type { Metadata } from 'next';
import ToastProvider from '@/components/ToastProvider';
import LoadingProvider from '@/components/LoadingProvider';
import RouteLoading from '@/components/RouteLoading';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'WeTrackX',
  description: 'Personal finance tracking app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LoadingProvider>
            <ToastProvider>
              <AppShell>
                <RouteLoading />
                {children}
              </AppShell>
            </ToastProvider>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
