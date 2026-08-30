import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WellSummary, DigitalTwinState } from '../types';
import { api } from '../services/api';

interface TwinContextType {
  selectedWellId: string;
  setSelectedWellId: (id: string) => void;
  wellsList: WellSummary[];
  twinState: DigitalTwinState | null;
  isLoading: boolean;
  error: string | null;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  isJudgingMode: boolean;
  setIsJudgingMode: (val: boolean) => void;
  judgingStep: number;
  setJudgingStep: (step: number) => void;
  refreshTwinState: () => Promise<void>;
  refreshWells: () => Promise<void>;
  resetJudgingDemo: () => Promise<void>;
}

const TwinContext = createContext<TwinContextType | undefined>(undefined);

export const TwinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedWellId, setSelectedWellId] = useState<string>('BGW-001');
  const [wellsList, setWellsList] = useState<WellSummary[]>([]);
  const [twinState, setTwinState] = useState<DigitalTwinState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Demo & Judging Mode State
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isJudgingMode, setIsJudgingMode] = useState<boolean>(false);
  const [judgingStep, setJudgingStep] = useState<number>(1);

  const refreshWells = useCallback(async () => {
    try {
      const data = await api.listWells();
      setWellsList(data);
    } catch (err: any) {
      console.error('Failed to fetch wells:', err);
      setError(err.message || 'Failed to load wells');
    }
  }, []);

  const refreshTwinState = useCallback(async () => {
    if (!selectedWellId) return;
    setIsLoading(true);
    setError(null);
    try {
      const state = await api.getWellState(selectedWellId);
      setTwinState(state);
    } catch (err: any) {
      console.error('Failed to load twin state:', err);
      setError(err.message || 'Failed to load digital twin state');
    } finally {
      setIsLoading(false);
    }
  }, [selectedWellId]);

  useEffect(() => {
    refreshWells();
  }, [refreshWells]);

  useEffect(() => {
    refreshTwinState();
  }, [refreshTwinState]);

  const resetJudgingDemo = async () => {
    setIsLoading(true);
    try {
      await api.resetDemoData();
      setSelectedWellId('BGW-001');
      setIsDemoMode(true);
      setJudgingStep(1);
      await refreshWells();
      await refreshTwinState();
    } catch (err: any) {
      console.error('Failed to reset demo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TwinContext.Provider
      value={{
        selectedWellId,
        setSelectedWellId,
        wellsList,
        twinState,
        isLoading,
        error,
        isDemoMode,
        setIsDemoMode,
        isJudgingMode,
        setIsJudgingMode,
        judgingStep,
        setJudgingStep,
        refreshTwinState,
        refreshWells,
        resetJudgingDemo,
      }}
    >
      {children}
    </TwinContext.Provider>
  );
};

export const useTwin = () => {
  const context = useContext(TwinContext);
  if (!context) {
    throw new Error('useTwin must be used within a TwinProvider');
  }
  return context;
};
