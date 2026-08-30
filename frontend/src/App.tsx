import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TwinProvider } from './context/TwinContext';
import { AppLayout } from './components/layout/AppLayout';

import { OverviewPage } from './pages/OverviewPage';
import { WellExplorerPage } from './pages/WellExplorerPage';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { JointOptimizerPage } from './pages/JointOptimizerPage';
import { CSSOptimizationPage } from './pages/CSSOptimizationPage';
import { SRPOptimizationPage } from './pages/SRPOptimizationPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { RiskReliabilityPage } from './pages/RiskReliabilityPage';
import { RealTimeMonitoringPage } from './pages/RealTimeMonitoringPage';
import { SimulationSandboxPage } from './pages/SimulationSandboxPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { SettingsAuditPage } from './pages/SettingsAuditPage';

export const App: React.FC = () => {
  return (
    <TwinProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="wells" element={<WellExplorerPage />} />
            <Route path="digital-twin" element={<DigitalTwinPage />} />
            <Route path="digital-twin/:wellId" element={<DigitalTwinPage />} />
            <Route path="optimization/joint" element={<JointOptimizerPage />} />
            <Route path="optimization/css" element={<CSSOptimizationPage />} />
            <Route path="optimization/srp" element={<SRPOptimizationPage />} />
            <Route path="predictions" element={<PredictionsPage />} />
            <Route path="risks" element={<RiskReliabilityPage />} />
            <Route path="monitoring" element={<RealTimeMonitoringPage />} />
            <Route path="simulation" element={<SimulationSandboxPage />} />
            <Route path="models" element={<ModelPerformancePage />} />
            <Route path="settings" element={<SettingsAuditPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TwinProvider>
  );
};
