'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  connectWallet as freighterConnect,
  detectWalletNetwork,
  checkFreighterInstalled,
  WatchWalletChanges,
} from '../utils/solaceService';

interface WalletContextType {
  walletKey: string;
  network: 'testnet' | 'mainnet';
  connecting: boolean;
  freighterReady: boolean | null;
  connect: () => Promise<string>;
  disconnect: () => void;
  setNetwork: (network: 'testnet' | 'mainnet') => void;
  toggleNetwork: () => void;
  setWalletKeyDirectly: (key: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({
  children,
  initialWallet = '',
  initialNetwork = 'testnet',
}: {
  children: ReactNode;
  initialWallet?: string;
  initialNetwork?: 'testnet' | 'mainnet';
}) {
  const [walletKey, setWalletKeyState] = useState<string>(() => {
    if (initialWallet && /^G[A-Z0-9]{55}$/.test(initialWallet)) {
      return initialWallet;
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('solace_connected_wallet');
        if (stored && /^G[A-Z0-9]{55}$/.test(stored)) return stored;
      } catch (_) {}
    }
    return '';
  });

  const [network, setNetworkState] = useState<'testnet' | 'mainnet'>(() => {
    if (initialNetwork === 'mainnet' || initialNetwork === 'testnet') {
      return initialNetwork;
    }
    if (typeof window !== 'undefined') {
      try {
        const storedNet = localStorage.getItem('solace-network');
        if (storedNet === 'mainnet' || storedNet === 'testnet') return storedNet;
      } catch (_) {}
    }
    return 'testnet';
  });

  const [connecting, setConnecting] = useState<boolean>(false);
  const [freighterReady, setFreighterReady] = useState<boolean | null>(null);

  const syncWalletToStorageAndCookies = useCallback((key: string) => {
    if (typeof window === 'undefined') return;
    try {
      if (key && /^G[A-Z0-9]{55}$/.test(key)) {
        localStorage.setItem('solace_connected_wallet', key);
        document.cookie = `solace_connected_wallet=${key}; path=/; max-age=31536000; SameSite=Lax`;
      } else {
        localStorage.removeItem('solace_connected_wallet');
        document.cookie = 'solace_connected_wallet=; path=/; max-age=0; SameSite=Lax';
      }
    } catch (_) {}
  }, []);

  const syncNetworkToStorageAndCookies = useCallback((net: 'testnet' | 'mainnet') => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('solace-network', net);
      document.cookie = `solace_network=${net}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (_) {}
  }, []);

  const setWalletKeyDirectly = useCallback((key: string) => {
    setWalletKeyState(key);
    syncWalletToStorageAndCookies(key);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('solace-wallet-updated', { detail: { walletKey: key } }));
    }
  }, [syncWalletToStorageAndCookies]);

  const setNetwork = useCallback((net: 'testnet' | 'mainnet') => {
    setNetworkState(net);
    syncNetworkToStorageAndCookies(net);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('solace-network-updated', { detail: { network: net } }));
    }
  }, [syncNetworkToStorageAndCookies]);

  const toggleNetwork = useCallback(() => {
    const next = network === 'mainnet' ? 'testnet' : 'mainnet';
    setNetwork(next);
  }, [network, setNetwork]);

  // Initial client hydration check and live wallet watcher
  useEffect(() => {
    try {
      const stored = localStorage.getItem('solace_connected_wallet');
      if (stored && /^G[A-Z0-9]{55}$/.test(stored)) {
        setWalletKeyState(stored);
        syncWalletToStorageAndCookies(stored);
      }
      const storedNet = localStorage.getItem('solace-network');
      if (storedNet === 'mainnet' || storedNet === 'testnet') {
        setNetworkState(storedNet);
        syncNetworkToStorageAndCookies(storedNet);
      }
    } catch (_) {}

    checkFreighterInstalled().then((installed) => {
      setFreighterReady(installed);
    });

    // Detect actual wallet network from Freighter API
    detectWalletNetwork().then((detected) => {
      if (detected) {
        setNetworkState(detected);
        syncNetworkToStorageAndCookies(detected);
      }
    });

    // Real-time WatchWalletChanges from Freighter extension
    let watcher: any = null;
    try {
      if (typeof window !== 'undefined' && WatchWalletChanges) {
        watcher = new WatchWalletChanges(2000);
        watcher.watch((params: any) => {
          if (params) {
            const netStr = String(params.network || params.networkPassphrase || '').toUpperCase();
            if (netStr.includes('PUBLIC') || netStr.includes('MAINNET')) {
              setNetworkState('mainnet');
              syncNetworkToStorageAndCookies('mainnet');
            } else if (netStr.includes('TEST') || netStr.includes('FUTURE')) {
              setNetworkState('testnet');
              syncNetworkToStorageAndCookies('testnet');
            }

            if (params.address && /^G[A-Z0-9]{55}$/.test(params.address)) {
              setWalletKeyState(params.address);
              syncWalletToStorageAndCookies(params.address);
            }
          }
        });
      }
    } catch (_) {}

    const handleWalletEvent = (e: any) => {
      const key = e.detail?.walletKey ?? (typeof window !== 'undefined' ? localStorage.getItem('solace_connected_wallet') : '') ?? '';
      setWalletKeyState(key);
      syncWalletToStorageAndCookies(key);
    };

    const handleNetworkEvent = (e: any) => {
      const net = e.detail?.network ?? (typeof window !== 'undefined' ? localStorage.getItem('solace-network') : 'testnet') ?? 'testnet';
      if (net === 'mainnet' || net === 'testnet') {
        setNetworkState(net);
        syncNetworkToStorageAndCookies(net);
      }
    };

    const handleFocus = async () => {
      try {
        const stored = localStorage.getItem('solace_connected_wallet');
        if (stored && /^G[A-Z0-9]{55}$/.test(stored)) {
          setWalletKeyState(stored);
        }
        const detected = await detectWalletNetwork();
        if (detected) {
          setNetworkState(detected);
          syncNetworkToStorageAndCookies(detected);
        }
      } catch (_) {}
    };

    window.addEventListener('solace-wallet-updated', handleWalletEvent);
    window.addEventListener('solace-network-updated', handleNetworkEvent);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (watcher && typeof watcher.stop === 'function') {
        try {
          watcher.stop();
        } catch (_) {}
      }
      window.removeEventListener('solace-wallet-updated', handleWalletEvent);
      window.removeEventListener('solace-network-updated', handleNetworkEvent);
      window.removeEventListener('focus', handleFocus);
    };
  }, [syncWalletToStorageAndCookies, syncNetworkToStorageAndCookies]);

  const connect = async (): Promise<string> => {
    setConnecting(true);
    try {
      const key = await freighterConnect();
      setWalletKeyState(key);
      syncWalletToStorageAndCookies(key);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('solace-wallet-updated', { detail: { walletKey: key } }));
      }
      return key;
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setWalletKeyState('');
    syncWalletToStorageAndCookies('');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('solace-wallet-updated', { detail: { walletKey: '' } }));
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletKey,
        network,
        connecting,
        freighterReady,
        connect,
        disconnect,
        setNetwork,
        toggleNetwork,
        setWalletKeyDirectly,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
