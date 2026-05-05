import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useIncidents } from './useIncidents';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { RCAPage } from './pages/RCAPage';
import { ReportsPage } from './pages/ReportsPage';
import { SignalsPage } from './pages/SignalsPage';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const {
    incidents,
    selectedIncident,
    loading,
    error,
    metrics,
    fetchIncidents,
    selectIncident,
    clearSelection,
    transitionState,
    submitRCA,
    sendSignal,
    runSimulation,
  } = useIncidents();

  if (loading) {
    return (
      <div className="flex h-screen bg-bg-base items-center justify-center relative overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] animate-pulse">Establishing Connection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-bg-base items-center justify-center p-6 relative overflow-hidden">
        <div className="bg-surface/10 border border-border-dim rounded-md p-10 max-w-sm text-center space-y-6">
          <div className="w-12 h-12 mx-auto rounded-md bg-critical/5 flex items-center justify-center border border-critical/20">
            <svg className="w-6 h-6 text-critical" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-white uppercase tracking-widest">Handshake Failed</h2>
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-tight leading-relaxed">{error}</p>
          </div>
          <button 
            onClick={fetchIncidents} 
            className="w-full bg-surface border border-border-dim text-slate-300 font-bold text-[10px] uppercase tracking-widest py-3 rounded hover:bg-white/5 transition-all"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  const handleTransition = async (state: string) => {
    try {
      await transitionState(state);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitRCA = async (data: any) => {
    try {
      await submitRCA(data);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRunSimulation = async () => {
    await runSimulation();
  };

  const handleRefresh = async () => {
    await fetchIncidents();
  };

  return (
    <Layout incidents={incidents} onRefresh={handleRefresh} onRunSimulation={handleRunSimulation} metrics={metrics}>
      <Routes>
        <Route path="/" element={
          <DashboardPage
            incidents={incidents}
            selectedIncident={selectedIncident}
            onSelect={selectIncident}
            onClearSelection={clearSelection}
            onTransition={handleTransition}
            onSubmitRCA={handleSubmitRCA}
          />
        } />
        <Route path="/incidents" element={
          <IncidentsPage
            incidents={incidents}
            selectedIncident={selectedIncident}
            onSelect={selectIncident}
            onClearSelection={clearSelection}
            onTransition={handleTransition}
            onSubmitRCA={handleSubmitRCA}
          />
        } />
        <Route path="/rca" element={
          <RCAPage
            incidents={incidents}
            onSelectIncident={selectIncident}
            onSubmitRCA={handleSubmitRCA}
            selectedIncident={selectedIncident}
          />
        } />
        <Route path="/reports" element={
          <ReportsPage incidents={incidents} />
        } />
        <Route path="/signals" element={
          <SignalsPage onSendSignal={sendSignal} />
        } />
        <Route path="/settings" element={
          <SettingsPage />
        } />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
