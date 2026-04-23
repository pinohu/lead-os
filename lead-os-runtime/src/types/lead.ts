// src/types/lead.ts
export interface Lead {
  id: number;
  email: string;
  name: string | null;
  message: string;
  tenant_id: string;
  created_at: Date;
}
