import { createContext, useContext, useState, ReactNode } from 'react';

interface AIChatContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export function AIChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <AIChatContext.Provider value={{ isOpen, setIsOpen, isMinimized, setIsMinimized }}>
      {children}
    </AIChatContext.Provider>
  );
}

export function useAIChat() {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error('useAIChat must be used within AIChatProvider');
  }
  return context;
}

