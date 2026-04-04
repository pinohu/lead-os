import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Building2, 
  Plus, 
  Search, 
  Phone, 
  Mail,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  Gift,
} from "lucide-react";
import type { TitleClient, SigningType } from "@/types/vendor";

type TitleClientStatsRow = {
  is_active: boolean;
  pilot_mode: boolean;
  total_orders?: number | null;
  completed_orders?: number | null;
};

const companyTypeLabels: Record<string, string> = {
  title_company: "Title Company",
  lender: "Lender",
  signing_service: "Signing Service",
  law_firm: "Law Firm",
};

export default function TitleClients() {
  const { isAdmin, isLoading: authLoading } = useAdminAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch clients
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["title-clients", filterType],
    queryFn: async () => {
      // Supabase types are stale - regenerate with `supabase gen types`
      let query = (supabase as any)
        .from("title_clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterType !== "all") {
        query = query.eq("company_type", filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as TitleClient[];
    },
    enabled: isAdmin,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["title-client-stats"],
    queryFn: async () => {
      // Supabase types are stale - regenerate with `supabase gen types`
      const { data, error } = await (supabase as any)
        .from("title_clients")
        .select("is_active, pilot_mode, total_orders, completed_orders");
      
      if (error) throw error;
      
      const clientData = (data || []) as TitleClientStatsRow[];
      return {
        total: clientData.length,
        active: clientData.filter((c) => c.is_active).length,
        pilot: clientData.filter((c) => c.pilot_mode).length,
        totalOrders: clientData.reduce((sum, c) => sum + (c.total_orders || 0), 0),
        completedOrders: clientData.reduce((sum, c) => sum + (c.completed_orders || 0), 0),
      };
    },
    enabled: isAdmin,
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TitleClient> }) => {
      // Supabase types are stale - regenerate with `supabase gen types`
      const { error } = await (supabase as any)
        .from("title_clients")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["title-clients"] });
      queryClient.invalidateQueries({ queryKey: ["title-client-stats"] });
      toast.success("Client updated successfully");
    },
    onError: () => {
      toast.error("Failed to update client");
    },
  });

  // Filter clients by search term
  const filteredClients = clients.filter((client) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      client.company_name.toLowerCase().includes(search) ||
      client.primary_contact_name.toLowerCase().includes(search) ||
      client.primary_contact_email.toLowerCase().includes(search)
    );
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                Title Clients
              </h1>
              <p className="text-gray-500 mt-1">
                Manage title companies, lenders, and signing service partners
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Onboard a new title company or lender partner
                  </DialogDescription>
                </DialogHeader>
                <ClientOnboardingForm onClose={() => setIsAddDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <div className="text-sm text-gray-500">Total Clients</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
              <div className="text-sm text-gray-500">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-600">{stats?.pilot || 0}</div>
              <div className="text-sm text-gray-500">Pilot Mode</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{stats?.totalOrders || 0}</div>
              <div className="text-sm text-gray-500">Total Orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-cyan-600">{stats?.completedOrders || 0}</div>
              <div className="text-sm text-gray-500">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="title_company">Title Company</SelectItem>
                  <SelectItem value="lender">Lender</SelectItem>
                  <SelectItem value="signing_service">Signing Service</SelectItem>
                  <SelectItem value="law_firm">Law Firm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        {clientsLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredClients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No clients found</h3>
              <p className="text-gray-500 mt-2">Add your first title client to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredClients.map((client) => (
              <ClientCard 
                key={client.id} 
                client={client}
                onUpdate={(updates) => 
                  updateClientMutation.mutate({ id: client.id, updates })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Client Card Component
function ClientCard({ 
  client, 
  onUpdate 
}: { 
  client: TitleClient;
  onUpdate: (updates: Partial<TitleClient>) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {client.company_name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-medium">{client.company_name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Badge variant="outline">
                    {companyTypeLabels[client.company_type] || client.company_type}
                  </Badge>
                  {client.is_active ? (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  {client.pilot_mode && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <Gift className="h-3 w-3 mr-1" />
                      Pilot ({client.pilot_signings_remaining} remaining)
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{client.primary_contact_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <Mail className="h-3 w-3" />
                  {client.primary_contact_email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <Phone className="h-3 w-3" />
                  {client.primary_contact_phone}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{client.total_orders}</span>
                  <span className="text-gray-500">orders</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{client.completed_orders}</span>
                  <span className="text-gray-500">completed</span>
                </div>
                {client.satisfaction_score && (
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{client.satisfaction_score}</span>
                    <span className="text-gray-500">satisfaction</span>
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm">
                  <span className="text-gray-500">Default: </span>
                  <span className="font-medium">
                    {client.default_signing_type === "ron" ? "RON" : "In-Person"}
                  </span>
                </div>
                <div className="text-sm mt-1">
                  <span className="text-gray-500">Confirm SLA: </span>
                  <span className="font-medium">{client.confirmation_sla_minutes}min</span>
                </div>
                <div className="text-sm mt-1">
                  <span className="text-gray-500">Terms: </span>
                  <span className="font-medium">{client.billing_terms}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-4">
            {client.pilot_mode && client.pilot_signings_remaining === 0 && (
              <Button 
                size="sm"
                onClick={() => onUpdate({ pilot_mode: false })}
              >
                Convert to Full
              </Button>
            )}
            {client.is_active ? (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onUpdate({ is_active: false })}
              >
                Deactivate
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onUpdate({ is_active: true })}
                className="text-green-600"
              >
                Activate
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Client Onboarding Form Component
function ClientOnboardingForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const clientData = {
      company_name: formData.get("company_name") as string,
      company_type: formData.get("company_type") as string,
      primary_contact_name: formData.get("contact_name") as string,
      primary_contact_email: formData.get("contact_email") as string,
      primary_contact_phone: formData.get("contact_phone") as string,
      billing_email: formData.get("billing_email") as string || null,
      address: formData.get("address") as string || null,
      city: formData.get("city") as string || null,
      state: formData.get("state") as string || null,
      zip_code: formData.get("zip_code") as string || null,
      default_signing_type: formData.get("signing_type") as SigningType,
      confirmation_sla_minutes: parseInt(formData.get("sla") as string) || 15,
      billing_terms: formData.get("billing_terms") as string || "net_30",
      is_active: true,
      pilot_mode: formData.get("pilot_mode") === "on",
      pilot_signings_remaining: 10,
    };

    try {
      // Supabase types are stale - regenerate with `supabase gen types`
      const { error } = await (supabase as any).from("title_clients").insert(clientData);
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["title-clients"] });
      queryClient.invalidateQueries({ queryKey: ["title-client-stats"] });
      toast.success("Client added successfully");
      onClose();
    } catch {
      toast.error("Failed to add client");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company_name">Company Name *</Label>
          <Input id="company_name" name="company_name" required />
        </div>
        <div>
          <Label htmlFor="company_type">Company Type *</Label>
          <Select name="company_type" required defaultValue="title_company">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title_company">Title Company</SelectItem>
              <SelectItem value="lender">Lender</SelectItem>
              <SelectItem value="signing_service">Signing Service</SelectItem>
              <SelectItem value="law_firm">Law Firm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contact_name">Primary Contact Name *</Label>
          <Input id="contact_name" name="contact_name" required />
        </div>
        <div>
          <Label htmlFor="contact_phone">Contact Phone *</Label>
          <Input id="contact_phone" name="contact_phone" type="tel" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contact_email">Contact Email *</Label>
          <Input id="contact_email" name="contact_email" type="email" required />
        </div>
        <div>
          <Label htmlFor="billing_email">Billing Email</Label>
          <Input id="billing_email" name="billing_email" type="email" />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" maxLength={2} />
        </div>
        <div>
          <Label htmlFor="zip_code">ZIP</Label>
          <Input id="zip_code" name="zip_code" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="signing_type">Default Signing Type</Label>
          <Select name="signing_type" defaultValue="in_person">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_person">In-Person</SelectItem>
              <SelectItem value="ron">RON</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="sla">Confirmation SLA (min)</Label>
          <Select name="sla" defaultValue="15">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 minutes (Rescue)</SelectItem>
              <SelectItem value="15">15 minutes (Priority)</SelectItem>
              <SelectItem value="60">60 minutes (Standard)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="billing_terms">Billing Terms</Label>
          <Select name="billing_terms" defaultValue="net_30">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prepaid">Prepaid</SelectItem>
              <SelectItem value="net_15">Net 15</SelectItem>
              <SelectItem value="net_30">Net 30</SelectItem>
              <SelectItem value="net_45">Net 45</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2 p-4 bg-purple-50 rounded-lg">
        <input type="checkbox" id="pilot_mode" name="pilot_mode" defaultChecked className="rounded" />
        <Label htmlFor="pilot_mode" className="text-purple-800">
          Enable Pilot Mode (first 10 signings free for trial)
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Client"}
        </Button>
      </div>
    </form>
  );
}

