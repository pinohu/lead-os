/**
 * Type definitions for admin components
 */

import type { Json } from "@/integrations/supabase/types";

export interface StatusUpdate {
  status: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  approved_at?: string;
  activated_at?: string;
}

export interface TcClientStatusUpdate extends StatusUpdate {
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'on_hold';
}

export interface CropApplicationStatusUpdate extends StatusUpdate {
  status: 'pending' | 'approved' | 'active' | 'rejected';
}

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string | null;
  status: string;
  preferred_date: string | null;
  preferred_time: string | null;
  document_type: string | null;
  location_address: string | null;
  urgency: string;
  number_of_signers: number | null;
  sms_opt_in: boolean | null;
  whatsapp_opt_in: boolean | null;
  whatsapp_number: string | null;
  marketing_source: string | null;
  suitedash_contact_id: string | null;
  suitedash_project_id: string | null;
  suitedash_synced_at: string | null;
  ai_booked: boolean | null;
  ai_confidence: number | null;
  call_recording_url: string | null;
  call_transcript: string | null;
  call_duration: number | null;
  tracking_number: string | null;
  agent_provider: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadScoreData {
  score: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  churnRisk: number;
}

export interface CallEventMetadata {
  [key: string]: Json | undefined;
}

export interface CallEvent {
  id: string;
  booking_id: string | null;
  caller_number: string | null;
  created_at: string | null;
  duration: number | null;
  event_type: string;
  metadata: CallEventMetadata | null;
  recording_url: string | null;
  tool: string;
  tracking_number: string | null;
  transcript: string | null;
}

export interface CallScalerConfig {
  number_pool: string[];
  default_number: string;
  [key: string]: Json | undefined;
}

export interface AgentConfig {
  id: string;
  provider: string;
  config: Json;
  intents: Json;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}
