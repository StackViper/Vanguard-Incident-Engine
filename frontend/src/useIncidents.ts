import { useState, useEffect, useCallback, useRef } from 'react';
import { api, WS_URL } from './api';
import type { Incident } from './types';

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({ throughput: 0 });
  const selectedIdRef = useRef<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    try {
      // Don't clear error here if we want to keep showing it until a success
      // But clearing it is fine for retry logic
      const res = await api.get('/incidents');
      setIncidents(res.data);
      setError(null);
      setLoading(false);
      return res.data;
    } catch (err: any) {
      console.error('Failed to fetch incidents', err);
      // Only set error if we don't have incidents yet or if it's a persistent failure
      setError(err.message || 'Failed to connect to backend');
      setLoading(false);
      throw err;
    }
  }, []);

  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedFetch = useCallback(() => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      fetchIncidents().catch(() => {});
    }, 500); // Wait 500ms for updates to settle
  }, [fetchIncidents]);

  const selectIncident = useCallback(async (id: string) => {
    try {
      const res = await api.get(`/incident/${id}`);
      setSelectedIncident(res.data);
      selectedIdRef.current = id;
    } catch (err) {
      console.error('Failed to load incident details', err);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIncident(null);
    selectedIdRef.current = null;
  }, []);

  const transitionState = useCallback(async (newState: string) => {
    if (!selectedIdRef.current) return;
    const id = selectedIdRef.current;
    try {
      await api.post(`/incident/${id}/transition`, { new_state: newState });
      await selectIncident(id);
      await fetchIncidents();
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Failed to transition state';
      throw new Error(detail);
    }
  }, [selectIncident, fetchIncidents]);

  const submitRCA = useCallback(async (rcaData: any) => {
    if (!selectedIdRef.current) return;
    const id = selectedIdRef.current;
    try {
      await api.post(`/incident/${id}/rca`, rcaData);
      await selectIncident(id);
      await fetchIncidents();
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Failed to submit RCA';
      throw new Error(detail);
    }
  }, [selectIncident, fetchIncidents]);

  const runSimulation = useCallback(async () => {
    try {
      return await api.post('/simulate');
    } catch (err: any) {
      console.error('Failed to run simulation', err);
      throw err;
    }
  }, []);

  const sendSignal = useCallback(async (signalData: any) => {
    try {
      await api.post('/signals', signalData);
      // Wait a bit for the worker to process
      setTimeout(() => fetchIncidents(), 1500);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Failed to send signal';
      throw new Error(detail);
    }
  }, [fetchIncidents]);

  // WebSocket connection
  useEffect(() => {
    fetchIncidents().catch(() => {});

    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(WS_URL);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'system_metrics') {
            setMetrics(data.data);
          } else if (data.type === 'incident_updated' || data.type === 'new_incident') {
            debouncedFetch();
            if (selectedIdRef.current && data.data?.id === selectedIdRef.current) {
              selectIncident(selectedIdRef.current);
            }
          }
        } catch {}
      };
      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 3000);
      };
      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [fetchIncidents, selectIncident]);

  return {
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
  };
}
