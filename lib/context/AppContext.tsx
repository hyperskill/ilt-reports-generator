'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppState, UploadedFiles, DisplaySettings, ProcessingResult, StudentComment } from '@/lib/types';

interface AppContextType extends AppState {
  setFiles: (files: UploadedFiles) => void;
  setExcludedUserIds: (ids: string[]) => void;
  setSettings: (settings: DisplaySettings) => void;
  setResults: (results: ProcessingResult) => void;
  setCurrentMode: (mode: 'performance' | 'dynamic') => void;
  setCurrentReportId: (id: string | null) => void;
  setStudentComment: (userId: string, comment: StudentComment) => void;
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
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<UploadedFiles>({});
  const [excludedUserIds, setExcludedUserIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<DisplaySettings>(initialSettings);
  const [results, setResults] = useState<ProcessingResult | undefined>();
  const [currentMode, setCurrentMode] = useState<'performance' | 'dynamic'>('performance');
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [studentComments, setStudentComments] = useState<Record<string, StudentComment>>({});

  const setStudentComment = (userId: string, comment: StudentComment) => {
    setStudentComments(prev => ({
      ...prev,
      [userId]: comment
    }));
  };

  const resetSession = () => {
    setFiles({});
    setExcludedUserIds([]);
    setSettings(initialSettings);
    setResults(undefined);
    setCurrentMode('performance');
    setCurrentReportId(null);
    setStudentComments({});
  };

  return (
    <AppContext.Provider
      value={{
        files,
        excludedUserIds,
        settings,
        results,
        currentMode,
        currentReportId,
        studentComments,
        setFiles,
        setExcludedUserIds,
        setSettings,
        setResults,
        setCurrentMode,
        setCurrentReportId,
        setStudentComment,
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

