import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as auth from '@/services/auth';
import * as storage from '@/services/storage';

type AuthState = 'loading' | 'setup' | 'locked' | 'unlocked';

interface AuthContextType {
  authState: AuthState;
  setupPin: (pin: string) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  lock: () => void;
  changePin: (currentPin: string, newPin: string) => Promise<boolean>;
  canUseBiometric: boolean;
  refreshBiometricPreference: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [canUseBiometric, setCanUseBiometric] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const lockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (authState !== 'unlocked') return;

    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        const timeout = await storage.getAutoLockTimeout();
        if (timeout > 0) {
          if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
          lockTimeoutRef.current = setTimeout(() => {
            auth.lock();
            setAuthState('locked');
            lockTimeoutRef.current = null;
          }, timeout * 1000);
        }
      } else if (nextState === 'active') {
        if (lockTimeoutRef.current) {
          clearTimeout(lockTimeoutRef.current);
          lockTimeoutRef.current = null;
        }
      }
    };

    const sub = AppState.addEventListener('change', (s) => handleAppStateChange(s));

    return () => {
      sub.remove();
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    };
  }, [authState]);

  async function checkAuth() {
    const setupComplete = await auth.isSetupComplete();
    if (!setupComplete) {
      setAuthState('setup');
      return;
    }

    const [hardwareEnrolled, biometricEnabled] = await Promise.all([
      auth.canUseBiometric(),
      storage.getBiometricEnabled(),
    ]);
    setCanUseBiometric(hardwareEnrolled && biometricEnabled);

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

  async function refreshBiometricPreference() {
    const [hardwareEnrolled, biometricEnabled] = await Promise.all([
      auth.canUseBiometric(),
      storage.getBiometricEnabled(),
    ]);
    setCanUseBiometric(hardwareEnrolled && biometricEnabled);
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
        changePin: auth.changePin,
        canUseBiometric,
        refreshBiometricPreference,
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
