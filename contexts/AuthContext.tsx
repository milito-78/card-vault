import React, { createContext, useContext, useEffect, useState } from 'react';
import * as auth from '@/services/auth';

type AuthState = 'loading' | 'setup' | 'locked' | 'unlocked';

interface AuthContextType {
  authState: AuthState;
  setupPin: (pin: string) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  lock: () => void;
  canUseBiometric: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [canUseBiometric, setCanUseBiometric] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const setupComplete = await auth.isSetupComplete();
    if (!setupComplete) {
      setAuthState('setup');
      return;
    }

    const canBiometric = await auth.canUseBiometric();
    setCanUseBiometric(canBiometric);

    if (auth.isUnlocked()) {
      setAuthState('unlocked');
      return;
    }

    setAuthState('locked');
  }

  async function setupPin(pin: string) {
    await auth.setupPin(pin);
    setAuthState('unlocked');
  }

  async function unlockWithPin(pin: string): Promise<boolean> {
    const success = await auth.unlockWithPin(pin);
    if (success) setAuthState('unlocked');
    return success;
  }

  async function unlockWithBiometric(): Promise<boolean> {
    const success = await auth.unlockWithBiometric();
    if (success) setAuthState('unlocked');
    return success;
  }

  function lock() {
    auth.lock();
    setAuthState('locked');
  }

  return (
    <AuthContext.Provider
      value={{
        authState,
        setupPin,
        unlockWithPin,
        unlockWithBiometric,
        lock,
        canUseBiometric,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
