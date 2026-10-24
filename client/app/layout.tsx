import type { Metadata } from 'next';
import React from 'react';
import { cookies } from 'next/headers';
import './globals.css';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SidebarDock from '../components/layout/SidebarDock';
import { WalletProvider } from '../context/WalletContext';

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
  const cookieStore = cookies();
  const initialWallet = cookieStore.get('solace_connected_wallet')?.value || '';
  const initialNetwork = (cookieStore.get('solace_network')?.value as 'testnet' | 'mainnet') || 'testnet';

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
                const isDisconnected = localStorage.getItem('solace_wallet_disconnected') === 'true';
                const storedWallet = localStorage.getItem('solace_connected_wallet');
                if (isDisconnected) {
                  document.cookie = 'solace_connected_wallet=; path=/; max-age=0; SameSite=Lax';
                } else if (storedWallet && !document.cookie.includes('solace_connected_wallet=')) {
                  document.cookie = 'solace_connected_wallet=' + storedWallet + '; path=/; max-age=31536000; SameSite=Lax';
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
      <body className="bg-[#f4f5f8] dark:bg-[#0a0d14] text-slate-800 dark:text-slate-100 min-h-screen antialiased flex flex-col justify-between selection:bg-accent selection:text-white transition-colors duration-200 overflow-x-hidden w-full max-w-full">
        <WalletProvider initialWallet={initialWallet} initialNetwork={initialNetwork}>
          <Navbar />
          <div className="flex-grow w-full max-w-full overflow-x-hidden">
            {children}
          </div>
          <SidebarDock />
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
