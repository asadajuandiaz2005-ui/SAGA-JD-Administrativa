import React, { createContext, useContext, type ReactNode } from 'react';
import { AlertContainer } from '../components/Alert/ui/AlertContainer';
import { useAlert } from '../hooks/useAlert';


type AlertContextType = ReturnType<typeof useAlert>;

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const alertMethods = useAlert();

  return (
    <AlertContext.Provider value={alertMethods}>
      {children}
      <AlertContainer />
    </AlertContext.Provider>
  );
};

export const useAlerts = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};