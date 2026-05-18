import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Users, 
  UserPlus, 
  Search, 
  Star, 
  MapPin, 
  Phone, 
  Mail,
  Award,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  BarChart3,
} from "lucide-react";
import type { Vendor, VendorTier, VendorStatus } from "@/types/vendor";
import { VENDOR_TIER_THRESHOLDS, getActiveStates } from "@/constants/stateEligibility";

type VendorStatsRow = {
  tier: string;
  status: string;
  primary_commission_state: string;
};

// Tier badge colors
const tierColors: Record<VendorTier, string> = {
  elite: "bg-purple-600 text-white",
  gold: "bg-yellow-500 text-black",
  silver: "bg-gray-400 text-white",
  bronze: "bg-orange-700 text-white",
};

// Status badge colors
const statusColors: Record<VendorStatus, string> = {
  active: "bg-green-600 text-white",
  pending: "bg-yellow-500 text-black",
  suspended: "bg-red-600 text-white",
  inactive: "bg-gray-500 text-white",
};

export default function VendorNetwork() {
  const { isAdmin, isLoading: authLoading } = useAdminAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState<string>("all");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch vendors
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ["vendors", filterState, filterTier, filterStatus],
    queryFn: async () => {
      // Supabase types are stale - regenerate with `supabase gen types`
      let query = (supabase as any)
        .from("vendors")
        .select("*")
        .order("elite_score", { ascending: false });

      if (filterState !== "all") {
        query = query.eq("primary_commission_state", filterState);
      }
      if (filterTier !== "all") {
        query = query.eq("tier", filterTier);
      }
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Vendor[];
    },
    enabled: isAdmin,
  });

  // Fetch vendor stats
  const { data: stats } = useQuery({
    queryKey: ["vendor-stats"],
    queryFn: async () => {
      // Supabase types are stale - regenerate with `supabase gen types`
      const { data, error } = await (supabase as any)
        .from("vendors")
        .select("tier, status, primary_commission_state");
      
      if (error) throw error;
      
      const vendorData = (data || []) as VendorStatsRow[];
      return {
        total: vendorData.length,
        elite: vendorData.filter((v) => v.tier === "elite").length,
        gold: vendorData.filter((v) => v.tier === "gold").length,
        silver: vendorData.filter((v) => v.tier === "silver").length,
        bronze: vendorData.filter((v) => v.tier === "bronze").length,
        active: vendorData.filter((v) => v.status === "active").length,
        pending: vendorData.filter((v) => v.status === "pending").length,
        stateBreakdown: vendorData.reduce((acc, v) => {
          acc[v.primary_commission_state] = (acc[v.primary_commission_state] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    },
    enabled: isAdmin,
  });

  // Update vendor status mutation
  const updateVendorMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Vendor> }) => {
      // Supabase types are stale - regenerate with `supabase gen types`
      const { error } = await (supabase as any)
        .from("vendors")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-stats"] });
      toast.success("Vendor updated successfully");
    },
    onError: () => {
      toast.error("Failed to update vendor");
    },
  });

  // Filter vendors by search term
  const filteredVendors = vendors.filter((vendor) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      vendor.first_name.toLowerCase().includes(search) ||
      vendor.last_name.toLowerCase().includes(search) ||
      vendor.email.toLowerCase().includes(search) ||
      vendor.city.toLowerCase().includes(search) ||
      vendor.primary_commission_state.toLowerCase().includes(search)
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

  const activeStates = getActiveStates();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Vendor Network
              </h1>
              <p className="text-gray-500 mt-1">
                Manage your national notary signing agent network
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Vendor</DialogTitle>
                  <DialogDescription>
                    Onboard a new notary signing agent to the network
                  </DialogDescription>
                </DialogHeader>
                <VendorOnboardingForm onClose={() => setIsAddDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <div className="text-sm text-gray-500">Total Vendors</div>
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
              <div className="text-2xl font-bold text-purple-600">{stats?.elite || 0}</div>
              <div className="text-sm text-gray-500">Elite Tier</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{stats?.gold || 0}</div>
              <div className="text-sm text-gray-500">Gold Tier</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-600">{stats?.silver || 0}</div>
              <div className="text-sm text-gray-500">Silver Tier</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
              <div className="text-sm text-gray-500">Pending</div>
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
                    placeholder="Search vendors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {activeStates.map((state) => (
                    <SelectItem key={state.state} value={state.state}>
                      {state.state} - {state.stateName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Vendors List */}
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="map">State Coverage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            {vendorsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredVendors.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No vendors found</h3>
                  <p className="text-gray-500 mt-2">
                    {searchTerm || filterState !== "all" || filterTier !== "all" || filterStatus !== "all"
                      ? "Try adjusting your filters"
                      : "Add your first vendor to get started"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredVendors.map((vendor) => (
                  <VendorCard 
                    key={vendor.id} 
                    vendor={vendor}
                    onUpdateStatus={(status) => 
                      updateVendorMutation.mutate({ id: vendor.id, updates: { status } })
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Coverage by State
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {activeStates.map((state) => {
                    const count = stats?.stateBreakdown[state.state] || 0;
                    return (
                      <div 
                        key={state.state}
                        className="p-4 rounded-lg border bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{state.state}</div>
                            <div className="text-sm text-gray-500">{state.stateName}</div>
                          </div>
                          <div className="text-2xl font-bold">{count}</div>
                        </div>
                        <div className="mt-2">
                          <Badge variant={count > 0 ? "default" : "secondary"}>
                            {count > 5 ? "Good Coverage" : count > 0 ? "Needs More" : "No Coverage"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Vendor Card Component
function VendorCard({ 
  vendor, 
  onUpdateStatus 
}: { 
  vendor: Vendor;
  onUpdateStatus: (status: VendorStatus) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {vendor.first_name[0]}{vendor.last_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">
                  {vendor.first_name} {vendor.last_name}
                </h3>
                <Badge className={tierColors[vendor.tier]}>
                  {vendor.tier.toUpperCase()}
                </Badge>
                <Badge className={statusColors[vendor.status]}>
                  {vendor.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {vendor.city}, {vendor.primary_commission_state}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {vendor.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {vendor.phone}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  Score: {vendor.elite_score}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  {vendor.total_signings} signings
                </span>
                <span className="flex items-center gap-1">
                  <Award className="h-3 w-3 text-blue-500" />
                  {vendor.first_pass_funding_rate}% first-pass
                </span>
                {vendor.ron_certified && (
                  <Badge variant="outline" className="text-xs">
                    RON Certified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vendor.status === "pending" && (
              <>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onUpdateStatus("active")}
                  className="text-green-600"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onUpdateStatus("inactive")}
                  className="text-red-600"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {vendor.status === "active" && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onUpdateStatus("suspended")}
              >
                Suspend
              </Button>
            )}
            {vendor.status === "suspended" && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onUpdateStatus("active")}
              >
                Reactivate
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Vendor Onboarding Form Component
function VendorOnboardingForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const vendorData = {
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zip_code: formData.get("zip_code") as string,
      primary_commission_state: formData.get("commission_state") as string,
      primary_commission_number: formData.get("commission_number") as string,
      primary_commission_expiry: formData.get("commission_expiry") as string,
      years_experience: parseInt(formData.get("years_experience") as string) || 0,
      has_dual_tray_printer: formData.get("dual_tray_printer") === "on",
      has_scanner: formData.get("scanner") === "on",
      ron_certified: formData.get("ron_certified") === "on",
      status: "pending" as const,
      tier: "bronze" as const,
      elite_score: 50,
    };

    try {
      // Supabase types are stale - regenerate with `supabase gen types`
      const { error } = await (supabase as any).from("vendors").insert(vendorData);
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-stats"] });
      toast.success("Vendor added successfully");
      onClose();
    } catch {
      toast.error("Failed to add vendor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStates = getActiveStates();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name</Label>
          <Input id="first_name" name="first_name" required />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name</Label>
          <Input id="last_name" name="last_name" required />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" required />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" required />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Select name="state" required>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {activeStates.map((s) => (
                <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="zip_code">ZIP Code</Label>
          <Input id="zip_code" name="zip_code" required />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="commission_state">Commission State</Label>
          <Select name="commission_state" required>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {activeStates.map((s) => (
                <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="commission_number">Commission #</Label>
          <Input id="commission_number" name="commission_number" required />
        </div>
        <div>
          <Label htmlFor="commission_expiry">Expiry Date</Label>
          <Input id="commission_expiry" name="commission_expiry" type="date" required />
        </div>
      </div>

      <div>
        <Label htmlFor="years_experience">Years of Experience</Label>
        <Input id="years_experience" name="years_experience" type="number" min="0" />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="dual_tray_printer" className="rounded" />
          <span className="text-sm">Dual-Tray Printer</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="scanner" className="rounded" />
          <span className="text-sm">Scanner</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="ron_certified" className="rounded" />
          <span className="text-sm">RON Certified</span>
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Vendor"}
        </Button>
      </div>
    </form>
  );
}

