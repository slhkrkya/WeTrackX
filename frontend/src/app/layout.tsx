import AppShell from '@/components/AppShell';
import './globals.css';
import type { Metadata } from 'next';
import ToastProvider from '@/components/ToastProvider';

export const metadata: Metadata = {
  title: 'WeTrackX',
  description: 'Personal finance tracking app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" data-theme="dark">
      <body>
          <ToastProvider>
            <AppShell>
              {children}
            </AppShell>
          </ToastProvider>
      </body>
    </html>
  );
}
