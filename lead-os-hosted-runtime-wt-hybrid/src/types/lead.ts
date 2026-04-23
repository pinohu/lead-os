export interface Lead {
  id: number
  email: string
  name: string | null
  message: string | null
  tenant_id: string
  created_at: string
}
