import type { Metadata } from 'next';
import React from 'react';
import { Inter, DM_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SidebarDock from '../components/layout/SidebarDock';
import { WalletProvider } from '../context/WalletContext';
import { ToastProvider } from '../context/ToastContext';
import NavProgress from '../components/layout/NavProgress';
import PresenceBeacon from '../components/layout/PresenceBeacon';
import ReportIssueDialog from '../components/layout/ReportIssueDialog';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'Solace | AI-Powered Stellar & Soroban Smart Contract Auditor',
  description: 'Detect bugs and security vulnerabilities in Soroban smart contracts before and after deployment.',
  icons: {
    icon: '/solace-logo.jpg',
    shortcut: '/solace-logo.jpg',
    apple: '/solace-logo.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No cookies() here: reading request cookies makes every route dynamic (no
  // prefetch, a server round-trip per click). The wallet session is restored
  // client-side by WalletProvider, which never used these initial values.

  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
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
                // Logins now live in sessionStorage (end when the browser closes).
                // Drop tokens persisted by older builds so they can't restore a session.
                localStorage.removeItem('solace_auth_token');
                localStorage.removeItem('solace_user_role');
                const isDisconnected = localStorage.getItem('solace_wallet_disconnected') === 'true';
                const authToken = sessionStorage.getItem('solace_auth_token');
                if (isDisconnected || !authToken) {
                  document.cookie = 'solace_connected_wallet=; path=/; max-age=0; SameSite=Lax';
                  document.cookie = 'solace_session=; path=/; max-age=0; SameSite=Lax';
                  localStorage.removeItem('solace_connected_wallet');
                }
                const storedNet = localStorage.getItem('solace-network');
                if (storedNet && !document.cookie.includes('solace_network=')) {
                  document.cookie = 'solace_network=' + storedNet + '; path=/; max-age=31536000; SameSite=Lax';
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="font-sans bg-[#f7f7f6] dark:bg-[#0e0e0e] text-slate-800 dark:text-slate-100 min-h-screen antialiased flex flex-col justify-between selection:bg-accent selection:text-white transition-colors duration-200 overflow-x-hidden w-full max-w-full">
        <ToastProvider>
          <WalletProvider>
            <NavProgress />
            <PresenceBeacon />
            <ReportIssueDialog />
            <Navbar />
            <div className="flex-grow w-full max-w-full overflow-x-hidden">
              {children}
            </div>
            <SidebarDock />
            <Footer />
          </WalletProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
