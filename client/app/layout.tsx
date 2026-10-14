import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

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
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased flex flex-col justify-between">
        <Navbar />
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
