// src/types/lead.ts
export interface Lead {
  id: number;
  email: string;
  name: string | null;
  message: string;
  category: string;
  tenant_id: string;
  created_at: Date;
}

export interface Node {
  id: number;
  name: string;
  category: string;
  webhook_url: string | null;
  email: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface LeadAssignment {
  id: number;
  lead_id: number;
  node_id: number;
  status: string;
  created_at: Date;
}

export interface DeliveryLog {
  id: number;
  lead_id: number;
  node_id: number;
  method: string;
  success: boolean;
  response: string | null;
  created_at: Date;
}
