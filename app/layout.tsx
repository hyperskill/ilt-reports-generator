import '@radix-ui/themes/styles.css';
import './globals.css';
import { Theme } from '@radix-ui/themes';
import type { Metadata } from 'next';
import { AppProvider } from '@/lib/context/AppContext';

export const metadata: Metadata = {
  title: 'Performance Segmentation - Report Builder',
  description: 'Analyze student performance and dynamic activity patterns',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Theme
          accentColor="blue"
          grayColor="slate"
          radius="medium"
          scaling="100%"
        >
          <AppProvider>
            {children}
          </AppProvider>
        </Theme>
      </body>
    </html>
  );
}

