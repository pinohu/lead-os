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
import { format } from "date-fns";
import { 
  FileText, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Calendar,
  Clock,
  User,
  Building,
  AlertCircle,
  CheckCircle,
  XCircle,
  Truck,
  DollarSign,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import type { SigningOrder, SigningOrderStatus, SigningType, ServiceTier, Vendor } from "@/types/vendor";
import { getActiveStates, SERVICE_TIERS } from "@/constants/stateEligibility";

type SigningOrderStatsRow = {
  status: string;
  signing_type: string;
  property_state: string;
};

// Status configuration
const statusConfig: Record<SigningOrderStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending_assignment: { label: "Pending Assignment", color: "bg-yellow-500", icon: Clock },
  assigned: { label: "Assigned", color: "bg-blue-500", icon: User },
  accepted: { label: "Accepted", color: "bg-green-500", icon: CheckCircle },
  declined: { label: "Declined", color: "bg-red-500", icon: XCircle },
  en_route: { label: "En Route", color: "bg-purple-500", icon: Truck },
  arrived: { label: "Arrived", color: "bg-indigo-500", icon: MapPin },
  in_progress: { label: "In Progress", color: "bg-cyan-500", icon: FileText },
  completed: { label: "Completed", color: "bg-green-600", icon: CheckCircle },
  scanback_pending: { label: "Scanback Pending", color: "bg-orange-500", icon: RefreshCw },
  scanback_uploaded: { label: "Scanback Uploaded", color: "bg-teal-500", icon: FileText },
  qa_review: { label: "QA Review", color: "bg-amber-500", icon: AlertCircle },
  shipped: { label: "Shipped", color: "bg-blue-600", icon: Truck },
  funded: { label: "Funded", color: "bg-green-700", icon: DollarSign },
  cancelled: { label: "Cancelled", color: "bg-gray-500", icon: XCircle },
  failed: { label: "Failed", color: "bg-red-700", icon: AlertCircle },
};

export default function SigningOrders() {
  const { isAdmin, isLoading: authLoading } = useAdminAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterState, setFilterState] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["signing-orders", filterStatus, filterState, filterType],
    queryFn: async () => {
      // Supabase types are stale - regenerate with `supabase gen types`
      let query = (supabase as any)
        .from("signing_orders")
        .select(`
          *,
          vendor:assigned_vendor_id(id, first_name, last_name, phone, email),
          title_client:title_client_id(id, company_name)
        `)
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }
      if (filterState !== "all") {
        query = query.eq("property_state", filterState);
      }
      if (filterType !== "all") {
        query = query.eq("signing_type", filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as SigningOrder[];
    },
    enabled: isAdmin,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["signing-order-stats"],
    queryFn: async () => {
      // Supabase types are stale - regenerate with `supabase gen types`
      const { data, error } = await (supabase as any)
        .from("signing_orders")
        .select("status, signing_type, property_state");
      
      if (error) throw error;
      
      const orderData = (data || []) as SigningOrderStatsRow[];
      const activeStatuses: SigningOrderStatus[] = [
        "pending_assignment", "assigned", "accepted", "en_route", 
        "arrived", "in_progress", "scanback_pending", "scanback_uploaded", "qa_review"
      ];
      
      return {
        total: orderData.length,
        active: orderData.filter((o) => activeStatuses.includes(o.status as SigningOrderStatus)).length,
        completed: orderData.filter((o) => o.status === "completed" || o.status === "funded").length,
        pending: orderData.filter((o) => o.status === "pending_assignment").length,
        inPerson: orderData.filter((o) => o.signing_type === "in_person").length,
        ron: orderData.filter((o) => o.signing_type === "ron").length,
      };
    },
    enabled: isAdmin,
  });

  // Fetch available vendors for assignment
  const { data: vendors = [] } = useQuery({
    queryKey: ["available-vendors"],
    queryFn: async () => {
      // Supabase types are stale - regenerate with `supabase gen types`
      const { data, error } = await (supabase as any)
        .from("vendors")
        .select("*")
        .eq("status", "active")
        .order("elite_score", { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Vendor[];
    },
    enabled: isAdmin,
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SigningOrder> }) => {
      // Supabase types are stale - regenerate with `supabase gen types`
      const { error } = await (supabase as any)
        .from("signing_orders")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signing-orders"] });
      queryClient.invalidateQueries({ queryKey: ["signing-order-stats"] });
      toast.success("Order updated successfully");
    },
    onError: () => {
      toast.error("Failed to update order");
    },
  });

  // Filter orders by search term
  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.order_number?.toLowerCase().includes(search) ||
      order.signer_name.toLowerCase().includes(search) ||
      order.property_address?.toLowerCase().includes(search) ||
      order.property_city?.toLowerCase().includes(search)
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
                <FileText className="h-6 w-6 text-primary" />
                Signing Orders
              </h1>
              <p className="text-gray-500 mt-1">
                Manage closing appointments and vendor assignments
              </p>
            </div>
            <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Signing Order</DialogTitle>
                  <DialogDescription>
                    Enter the signing details to create a new order
                  </DialogDescription>
                </DialogHeader>
                <NewOrderForm 
                  vendors={vendors}
                  onClose={() => setIsNewOrderOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <div className="text-sm text-gray-500">Total Orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{stats?.active || 0}</div>
              <div className="text-sm text-gray-500">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
              <div className="text-sm text-gray-500">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-600">{stats?.inPerson || 0}</div>
              <div className="text-sm text-gray-500">In-Person</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-cyan-600">{stats?.ron || 0}</div>
              <div className="text-sm text-gray-500">RON</div>
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
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {activeStates.map((state) => (
                    <SelectItem key={state.state} value={state.state}>
                      {state.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="in_person">In-Person</SelectItem>
                  <SelectItem value="ron">RON</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Needs Action</TabsTrigger>
            <TabsTrigger value="active">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <OrdersList 
              orders={filteredOrders}
              isLoading={ordersLoading}
              vendors={vendors}
              onUpdate={(id, updates) => updateOrderMutation.mutate({ id, updates })}
            />
          </TabsContent>
          
          <TabsContent value="pending">
            <OrdersList 
              orders={filteredOrders.filter(o => 
                o.status === "pending_assignment" || 
                o.status === "declined" ||
                o.status === "qa_review"
              )}
              isLoading={ordersLoading}
              vendors={vendors}
              onUpdate={(id, updates) => updateOrderMutation.mutate({ id, updates })}
            />
          </TabsContent>
          
          <TabsContent value="active">
            <OrdersList 
              orders={filteredOrders.filter(o => 
                ["assigned", "accepted", "en_route", "arrived", "in_progress", "scanback_pending", "scanback_uploaded"].includes(o.status)
              )}
              isLoading={ordersLoading}
              vendors={vendors}
              onUpdate={(id, updates) => updateOrderMutation.mutate({ id, updates })}
            />
          </TabsContent>
          
          <TabsContent value="completed">
            <OrdersList 
              orders={filteredOrders.filter(o => 
                o.status === "completed" || 
                o.status === "shipped" || 
                o.status === "funded"
              )}
              isLoading={ordersLoading}
              vendors={vendors}
              onUpdate={(id, updates) => updateOrderMutation.mutate({ id, updates })}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Orders List Component
function OrdersList({ 
  orders, 
  isLoading,
  vendors,
  onUpdate,
}: { 
  orders: SigningOrder[];
  isLoading: boolean;
  vendors: Vendor[];
  onUpdate: (id: string, updates: Partial<SigningOrder>) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
          <p className="text-gray-500 mt-2">Create your first signing order to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard 
          key={order.id} 
          order={order}
          vendors={vendors}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}

// Order Card Component
function OrderCard({ 
  order,
  vendors,
  onUpdate,
}: { 
  order: SigningOrder;
  vendors: Vendor[];
  onUpdate: (id: string, updates: Partial<SigningOrder>) => void;
}) {
  const status = statusConfig[order.status];
  const StatusIcon = status?.icon || Clock;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-sm font-medium text-primary">
                {order.order_number}
              </span>
              <Badge className={`${status?.color} text-white`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status?.label}
              </Badge>
              <Badge variant="outline">
                {order.signing_type === "ron" ? "RON" : order.signing_type === "hybrid" ? "Hybrid" : "In-Person"}
              </Badge>
              <Badge variant="secondary">
                {order.service_tier?.toUpperCase() || "STANDARD"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Signer Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Signer</h4>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{order.signer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <Phone className="h-3 w-3" />
                  {order.signer_phone}
                </div>
              </div>

              {/* Property Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Property</h4>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm">{order.property_address}</div>
                    <div className="text-sm text-gray-500">
                      {order.property_city}, {order.property_state} {order.property_zip}
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Appointment</h4>
                {order.appointment_date ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>
                      {format(new Date(order.appointment_date), "MMM d, yyyy")}
                      {order.appointment_time && ` at ${order.appointment_time}`}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Not scheduled</span>
                )}
              </div>
            </div>

            {/* Vendor Assignment */}
            {order.vendor && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="font-medium">
                    Assigned to: {order.vendor.first_name} {order.vendor.last_name}
                  </span>
                  <span className="text-gray-500">({order.vendor.phone})</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 ml-4">
            {order.status === "pending_assignment" && (
              <Select
                onValueChange={(vendorId) => {
                  onUpdate(order.id, {
                    assigned_vendor_id: vendorId,
                    status: "assigned",
                    assigned_at: new Date().toISOString(),
                  });
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Assign Vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors
                    .filter(v => v.primary_commission_state === order.property_state)
                    .map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.first_name} {vendor.last_name} ({vendor.tier})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}

            {order.status === "assigned" && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onUpdate(order.id, { 
                    status: "accepted",
                    accepted_at: new Date().toISOString(),
                  })}
                  className="text-green-600"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onUpdate(order.id, { 
                    status: "declined",
                    declined_at: new Date().toISOString(),
                  })}
                  className="text-red-600"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            )}

            {order.status === "accepted" && (
              <Button 
                size="sm"
                onClick={() => onUpdate(order.id, { 
                  status: "en_route",
                  vendor_en_route_at: new Date().toISOString(),
                })}
              >
                <Truck className="h-4 w-4 mr-1" />
                En Route
              </Button>
            )}

            {order.status === "en_route" && (
              <Button 
                size="sm"
                onClick={() => onUpdate(order.id, { 
                  status: "arrived",
                  vendor_arrived_at: new Date().toISOString(),
                })}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Arrived
              </Button>
            )}

            {order.status === "arrived" && (
              <Button 
                size="sm"
                onClick={() => onUpdate(order.id, { 
                  status: "in_progress",
                  signing_started_at: new Date().toISOString(),
                })}
              >
                <FileText className="h-4 w-4 mr-1" />
                Start Signing
              </Button>
            )}

            {order.status === "in_progress" && (
              <Button 
                size="sm"
                onClick={() => onUpdate(order.id, { 
                  status: "completed",
                  signing_completed_at: new Date().toISOString(),
                })}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Button>
            )}

            {order.status === "cancelled" && (
              <Badge variant="destructive">Cancelled</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// New Order Form Component
function NewOrderForm({ 
  vendors,
  onClose 
}: { 
  vendors: Vendor[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedState, setSelectedState] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const orderData = {
      signing_type: formData.get("signing_type") as SigningType,
      service_tier: formData.get("service_tier") as ServiceTier,
      signer_name: formData.get("signer_name") as string,
      signer_phone: formData.get("signer_phone") as string,
      signer_email: formData.get("signer_email") as string || null,
      property_address: formData.get("property_address") as string,
      property_city: formData.get("property_city") as string,
      property_state: formData.get("property_state") as string,
      property_zip: formData.get("property_zip") as string,
      loan_type: formData.get("loan_type") as string || null,
      appointment_date: formData.get("appointment_date") as string || null,
      appointment_time: formData.get("appointment_time") as string || null,
      special_instructions: formData.get("special_instructions") as string || null,
      status: "pending_assignment" as const,
    };

    try {
      // Supabase types are stale - regenerate with `supabase gen types`
      const { error } = await (supabase as any).from("signing_orders").insert(orderData);
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["signing-orders"] });
      queryClient.invalidateQueries({ queryKey: ["signing-order-stats"] });
      toast.success("Order created successfully");
      onClose();
    } catch {
      toast.error("Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStates = getActiveStates();
  const availableVendors = vendors.filter(v => v.primary_commission_state === selectedState);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Signing Type & Tier */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="signing_type">Signing Type</Label>
          <Select name="signing_type" required>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_person">In-Person</SelectItem>
              <SelectItem value="ron">RON (Remote)</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="service_tier">Service Tier</Label>
          <Select name="service_tier" defaultValue="standard">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_TIERS.map((tier) => (
                <SelectItem key={tier.id} value={tier.id}>
                  {tier.name} (${tier.baseFeeRange[0]}-${tier.baseFeeRange[1]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Signer Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="signer_name">Signer Name</Label>
          <Input id="signer_name" name="signer_name" required />
        </div>
        <div>
          <Label htmlFor="signer_phone">Signer Phone</Label>
          <Input id="signer_phone" name="signer_phone" type="tel" required />
        </div>
      </div>

      <div>
        <Label htmlFor="signer_email">Signer Email (optional)</Label>
        <Input id="signer_email" name="signer_email" type="email" />
      </div>

      {/* Property Info */}
      <div>
        <Label htmlFor="property_address">Property Address</Label>
        <Input id="property_address" name="property_address" required />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="property_city">City</Label>
          <Input id="property_city" name="property_city" required />
        </div>
        <div>
          <Label htmlFor="property_state">State</Label>
          <Select 
            name="property_state" 
            required
            onValueChange={setSelectedState}
          >
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
          <Label htmlFor="property_zip">ZIP</Label>
          <Input id="property_zip" name="property_zip" required />
        </div>
      </div>

      {selectedState && availableVendors.length > 0 && (
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-sm font-medium text-green-800">
            ✓ {availableVendors.length} vendors available in {selectedState}
          </div>
        </div>
      )}

      {selectedState && availableVendors.length === 0 && (
        <div className="p-3 bg-yellow-50 rounded-lg">
          <div className="text-sm font-medium text-yellow-800">
            ⚠ No vendors available in {selectedState}. Order will need manual assignment.
          </div>
        </div>
      )}

      {/* Loan Type */}
      <div>
        <Label htmlFor="loan_type">Loan Type (optional)</Label>
        <Select name="loan_type">
          <SelectTrigger>
            <SelectValue placeholder="Select loan type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="purchase">Purchase</SelectItem>
            <SelectItem value="refinance">Refinance</SelectItem>
            <SelectItem value="heloc">HELOC</SelectItem>
            <SelectItem value="reverse">Reverse Mortgage</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="va">VA Loan</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Appointment */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="appointment_date">Appointment Date</Label>
          <Input id="appointment_date" name="appointment_date" type="date" />
        </div>
        <div>
          <Label htmlFor="appointment_time">Appointment Time</Label>
          <Input id="appointment_time" name="appointment_time" type="time" />
        </div>
      </div>

      {/* Special Instructions */}
      <div>
        <Label htmlFor="special_instructions">Special Instructions</Label>
        <Textarea 
          id="special_instructions" 
          name="special_instructions"
          placeholder="Gate code, parking info, special requirements..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Order"}
        </Button>
      </div>
    </form>
  );
}

