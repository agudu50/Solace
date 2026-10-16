import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SidebarDock from '../components/layout/SidebarDock';

export const metadata: Metadata = {
  title: 'Solace | AI-Powered Stellar & Soroban Smart Contract Auditor',
  description: 'Detect bugs and security vulnerabilities in Soroban smart contracts before and after deployment.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('solace-theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="bg-[#f4f5f8] dark:bg-[#0a0d14] text-slate-800 dark:text-slate-100 min-h-screen antialiased flex flex-col justify-between selection:bg-accent selection:text-white transition-colors duration-200 overflow-x-hidden w-full max-w-full">
        <Navbar />
        <div className="flex-grow w-full max-w-full overflow-x-hidden">
          {children}
        </div>
        <SidebarDock />
        <Footer />
      </body>
    </html>
  );
}
