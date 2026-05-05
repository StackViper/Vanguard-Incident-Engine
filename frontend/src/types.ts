export interface Signal {
  _id?: string;
  component_id: string;
  timestamp: string;
  error_type: string;
  metadata: Record<string, any>;
  work_item_id?: string;
  ingested_at?: string;
  message?: string;
}

export interface RCA {
  id: string;
  work_item_id: string;
  root_cause_category: string;
  fix_applied: string;
  prevention_steps: string;
  start_time: string;
  end_time: string;
}

export interface Incident {
  id: string;
  component_id: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  updated_at: string;
  rca: RCA | null;
  signals?: Signal[];
}

export interface RCAFormData {
  root_cause_category: string;
  fix_applied: string;
  prevention_steps: string;
  start_time: string;
  end_time: string;
}

export interface SignalFormData {
  component_id: string;
  error_type: string;
  metadata: Record<string, string>;
}
