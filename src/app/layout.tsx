import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ResumeFlow | Rupeeapex Group of Companies',
  description: 'HR Job Application Management Portal for Rupeeapex Group of Companies',
  icons: {
    icon: '/logo/rupeeapex-logo.jpeg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-[#006B3C] selection:text-white">
        {children}
      </body>
    </html>
  );
}

