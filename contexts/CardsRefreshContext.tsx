import React, { createContext, useContext, useState, useCallback } from 'react';

interface CardsRefreshContextType {
  refreshTrigger: number;
  refreshCards: () => void;
}

const CardsRefreshContext = createContext<CardsRefreshContextType | null>(null);

export function CardsRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshCards = useCallback(() => {
    setRefreshTrigger((n) => n + 1);
  }, []);

  return (
    <CardsRefreshContext.Provider value={{ refreshTrigger, refreshCards }}>
      {children}
    </CardsRefreshContext.Provider>
  );
}

export function useCardsRefresh() {
  const context = useContext(CardsRefreshContext);
  if (!context) throw new Error('useCardsRefresh must be used within CardsRefreshProvider');
  return context;
}
