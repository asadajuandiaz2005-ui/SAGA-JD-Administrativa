import type { AllowedModulesContextProps, Module } from '@/Modules/Global/types/Module'
import React, { createContext, useContext, type ReactNode, useMemo } from 'react'

interface AllowedModulesProviderProps {
  allowedModules: Module[];
  children: ReactNode;
}

const AllowedModulesContext = createContext<AllowedModulesContextProps>({ allowedModules: [] })

export const useAllowedModules = () => useContext(AllowedModulesContext)

export const AllowedModulesProvider: React.FC<AllowedModulesProviderProps> = ({ allowedModules, children }) => {
  const contextValue = useMemo(() => ({ allowedModules }), [allowedModules]);
  return (
    <AllowedModulesContext.Provider value={contextValue}>
      {children}
    </AllowedModulesContext.Provider>
  );
};