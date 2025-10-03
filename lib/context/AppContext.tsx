'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppState, UploadedFiles, DisplaySettings, ProcessingResult } from '@/lib/types';

interface AppContextType extends AppState {
  setFiles: (files: UploadedFiles) => void;
  setExcludedUserIds: (ids: string[]) => void;
  setSettings: (settings: DisplaySettings) => void;
  setResults: (results: ProcessingResult) => void;
  setCurrentMode: (mode: 'performance' | 'dynamic') => void;
  resetSession: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialSettings: DisplaySettings = {
  timeBucketing: 'daily',
  smoothing: 'off',
  includeMeetingsInActivity: true,
  useMeetingsInSegmentation: true,
  alpha: 1.0,
  beta: 1.5,
  gamma: 0.02,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<UploadedFiles>({});
  const [excludedUserIds, setExcludedUserIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<DisplaySettings>(initialSettings);
  const [results, setResults] = useState<ProcessingResult | undefined>();
  const [currentMode, setCurrentMode] = useState<'performance' | 'dynamic'>('performance');

  const resetSession = () => {
    setFiles({});
    setExcludedUserIds([]);
    setSettings(initialSettings);
    setResults(undefined);
    setCurrentMode('performance');
  };

  return (
    <AppContext.Provider
      value={{
        files,
        excludedUserIds,
        settings,
        results,
        currentMode,
        setFiles,
        setExcludedUserIds,
        setSettings,
        setResults,
        setCurrentMode,
        resetSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

