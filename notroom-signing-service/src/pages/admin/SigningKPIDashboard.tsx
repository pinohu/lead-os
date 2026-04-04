import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  FileText,
  AlertCircle,
  Target,
  Zap,
  Award,
  MapPin,
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { getActiveStates } from "@/constants/stateEligibility";

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

/** Rows from signing_orders until Supabase types are regenerated */
type KpiOrderRow = {
  status: string;
  signing_type: string;
  service_tier: string;
  property_state: string;
  first_pass_funded?: boolean | null;
  created_at: string;
};

type KpiVendorRow = {
  tier: string;
  status: string;
  elite_score?: number | null;
  first_pass_funding_rate?: number | null;
  total_signings?: number | null;
  primary_commission_state: string;
};

type KpiTitleClientRow = {
  is_active: boolean;
  pilot_mode: boolean;
  total_orders?: number | null;
  completed_orders?: number | null;
  satisfaction_score?: number | null;
};

export default function SigningKPIDashboard() {
  const { isAdmin, isLoading: authLoading } = useAdminAuth();

  // Fetch signing order stats
  const { data: orderStats } = useQuery({
    queryKey: ["kpi-order-stats"],
    queryFn: async () => {
      // Supabase types are stale - regenerate with `supabase gen types`
      const { data: orders } = await (supabase as any)
        .from("signing_orders")
        .select("status, signing_type, service_tier, property_state, first_pass_funded, created_at");

      if (!orders) return null;

      const orderRows = orders as KpiOrderRow[];
      const total = orderRows.length;
      const completed = orderRows.filter(o => o.status === "completed" || o.status === "funded" || o.status === "shipped").length;
      const funded = orderRows.filter(o => o.status === "funded").length;
      const firstPassFunded = orderRows.filter(o => o.first_pass_funded).length;
      const failed = orderRows.filter(o => o.status === "failed" || o.status === "cancelled").length;
      const pending = orderRows.filter(o => o.status === "pending_assignment").length;
      const inProgress = orderRows.filter(o => 
        ["assigned", "accepted", "en_route", "arrived", "in_progress", "scanback_pending", "scanback_uploaded", "qa_review"].includes(o.status)
      ).length;

      // By type
      const ron = orderRows.filter(o => o.signing_type === "ron").length;
      const inPerson = orderRows.filter(o => o.signing_type === "in_person").length;
      const hybrid = orderRows.filter(o => o.signing_type === "hybrid").length;

      // By tier
      const standard = orderRows.filter(o => o.service_tier === "standard").length;
      const priority = orderRows.filter(o => o.service_tier === "priority").length;
      const rescue = orderRows.filter(o => o.service_tier === "rescue").length;

      // By state
      const byState = orderRows.reduce((acc: Record<string, number>, o) => {
        acc[o.property_state] = (acc[o.property_state] || 0) + 1;
        return acc;
      }, {});

      // Last 30 days trend
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentOrders = orderRows.filter(o => new Date(o.created_at) >= thirtyDaysAgo);

      return {
        total,
        completed,
        funded,
        firstPassFunded,
        failed,
        pending,
        inProgress,
        ron,
        inPerson,
        hybrid,
        standard,
        priority,
        rescue,
        byState,
        recentCount: recentOrders.length,
        firstPassFundingRate: completed > 0 ? Math.round((firstPassFunded / completed) * 100) : 0,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        failureRate: total > 0 ? Math.round((failed / total) * 100) : 0,
      };
    },
    enabled: isAdmin,
  });

  // Fetch vendor stats
  const { data: vendorStats } = useQuery({
    queryKey: ["kpi-vendor-stats"],
    queryFn: async () => {
      // Supabase types are stale - regenerate with `supabase gen types`
      const { data: vendors } = await (supabase as any)
        .from("vendors")
        .select("tier, status, elite_score, first_pass_funding_rate, total_signings, primary_commission_state");

      if (!vendors) return null;

      const vendorRows = vendors as KpiVendorRow[];
      const total = vendorRows.length;
      const active = vendorRows.filter(v => v.status === "active").length;
      const elite = vendorRows.filter(v => v.tier === "elite").length;
      const gold = vendorRows.filter(v => v.tier === "gold").length;
      const silver = vendorRows.filter(v => v.tier === "silver").length;
      const bronze = vendorRows.filter(v => v.tier === "bronze").length;

      const avgScore = vendorRows.length > 0 
        ? Math.round(vendorRows.reduce((sum: number, v) => sum + (v.elite_score || 0), 0) / vendorRows.length)
        : 0;

      const avgFundingRate = vendorRows.length > 0
        ? Math.round(vendorRows.reduce((sum: number, v) => sum + (v.first_pass_funding_rate || 0), 0) / vendorRows.length)
        : 0;

      const totalSignings = vendorRows.reduce((sum: number, v) => sum + (v.total_signings || 0), 0);

      // By state
      const byState = vendorRows.reduce((acc: Record<string, number>, v) => {
        acc[v.primary_commission_state] = (acc[v.primary_commission_state] || 0) + 1;
        return acc;
      }, {});

      return {
        total,
        active,
        elite,
        gold,
        silver,
        bronze,
        avgScore,
        avgFundingRate,
        totalSignings,
        byState,
      };
    },
    enabled: isAdmin,
  });

  // Fetch client stats
  const { data: clientStats } = useQuery({
    queryKey: ["kpi-client-stats"],
    queryFn: async () => {
      // Supabase types are stale - regenerate with `supabase gen types`
      const { data: clients } = await (supabase as any)
        .from("title_clients")
        .select("is_active, pilot_mode, total_orders, completed_orders, satisfaction_score");

      if (!clients) return null;

      const clientRows = clients as KpiTitleClientRow[];
      const total = clientRows.length;
      const active = clientRows.filter(c => c.is_active).length;
      const pilot = clientRows.filter(c => c.pilot_mode).length;
      const totalOrders = clientRows.reduce((sum: number, c) => sum + (c.total_orders || 0), 0);
      const completedOrders = clientRows.reduce((sum: number, c) => sum + (c.completed_orders || 0), 0);
      const withSatisfaction = clientRows.filter(c => c.satisfaction_score);
      const avgSatisfaction = withSatisfaction.length > 0
        ? Math.round(withSatisfaction.reduce((sum: number, c) => sum + (c.satisfaction_score || 0), 0) / withSatisfaction.length * 100)
        : 0;

      return {
        total,
        active,
        pilot,
        totalOrders,
        completedOrders,
        avgSatisfaction,
      };
    },
    enabled: isAdmin,
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

  // Prepare chart data
  const typeData = [
    { name: "In-Person", value: orderStats?.inPerson || 0, color: "#3b82f6" },
    { name: "RON", value: orderStats?.ron || 0, color: "#8b5cf6" },
    { name: "Hybrid", value: orderStats?.hybrid || 0, color: "#06b6d4" },
  ];

  const tierData = [
    { name: "Standard", value: orderStats?.standard || 0, color: "#6b7280" },
    { name: "Priority", value: orderStats?.priority || 0, color: "#f59e0b" },
    { name: "Rescue", value: orderStats?.rescue || 0, color: "#ef4444" },
  ];

  const vendorTierData = [
    { name: "Elite", value: vendorStats?.elite || 0, color: "#8b5cf6" },
    { name: "Gold", value: vendorStats?.gold || 0, color: "#f59e0b" },
    { name: "Silver", value: vendorStats?.silver || 0, color: "#9ca3af" },
    { name: "Bronze", value: vendorStats?.bronze || 0, color: "#b45309" },
  ];

  const stateData = activeStates.map(state => ({
    state: state.state,
    orders: orderStats?.byState[state.state] || 0,
    vendors: vendorStats?.byState[state.state] || 0,
  })).sort((a, b) => b.orders - a.orders);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Signing Service KPIs
              </h1>
              <p className="text-gray-500 mt-1">
                Track first-pass funding rate, vendor performance, and operational metrics
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
              <Target className="h-4 w-4 mr-2" />
              Target: 98% First-Pass Funding
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Critical KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* First-Pass Funding Rate - THE KEY METRIC */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold">
                    {orderStats?.firstPassFundingRate || 0}%
                  </div>
                  <div className="text-sm text-white/80">First-Pass Funding Rate</div>
                </div>
                <div className={`p-3 rounded-full ${
                  (orderStats?.firstPassFundingRate || 0) >= 98 
                    ? "bg-white/20" 
                    : "bg-red-500/50"
                }`}>
                  {(orderStats?.firstPassFundingRate || 0) >= 98 
                    ? <TrendingUp className="h-6 w-6" />
                    : <TrendingDown className="h-6 w-6" />
                  }
                </div>
              </div>
              <Progress 
                value={orderStats?.firstPassFundingRate || 0} 
                className="mt-4 bg-white/20 h-2"
              />
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {orderStats?.completionRate || 0}%
                  </div>
                  <div className="text-sm text-gray-500">Completion Rate</div>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {orderStats?.completed || 0} of {orderStats?.total || 0} orders
              </div>
            </CardContent>
          </Card>

          {/* Failure Rate */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-red-600">
                    {orderStats?.failureRate || 0}%
                  </div>
                  <div className="text-sm text-gray-500">Failure Rate</div>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {orderStats?.failed || 0} failed/cancelled
              </div>
            </CardContent>
          </Card>

          {/* Active Orders */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-amber-600">
                    {orderStats?.inProgress || 0}
                  </div>
                  <div className="text-sm text-gray-500">Active Orders</div>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {orderStats?.pending || 0} pending assignment
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vendors">Vendor Performance</TabsTrigger>
            <TabsTrigger value="states">State Coverage</TabsTrigger>
            <TabsTrigger value="clients">Client Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Types Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Orders by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {typeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    {typeData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-gray-600">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Service Tiers Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Orders by Service Tier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tierData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {tierData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-600">
                        ${125}
                      </div>
                      <div className="text-xs text-gray-500">Standard Avg</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-amber-600">
                        ${200}
                      </div>
                      <div className="text-xs text-gray-500">Priority Avg</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        ${300}
                      </div>
                      <div className="text-xs text-gray-500">Rescue Avg</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vendors">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Vendor Summary Cards */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">{vendorStats?.total || 0}</div>
                      <div className="text-sm text-gray-500">Total Vendors</div>
                    </div>
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div className="mt-4 text-sm">
                    <span className="text-green-600 font-medium">{vendorStats?.active || 0} active</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-purple-600">{vendorStats?.avgScore || 0}</div>
                      <div className="text-sm text-gray-500">Avg Elite Score</div>
                    </div>
                    <Award className="h-8 w-8 text-purple-500" />
                  </div>
                  <Progress value={vendorStats?.avgScore || 0} className="mt-4" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-green-600">{vendorStats?.avgFundingRate || 0}%</div>
                      <div className="text-sm text-gray-500">Avg Funding Rate</div>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                  <Progress value={vendorStats?.avgFundingRate || 0} className="mt-4 bg-green-100" />
                </CardContent>
              </Card>

              {/* Vendor Tier Distribution */}
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle className="text-lg">Vendor Network by Tier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vendorTierData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {vendorTierData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-4 text-center">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">{vendorStats?.elite || 0}</div>
                      <div className="text-xs text-gray-500">Elite (90+)</div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <div className="text-xl font-bold text-amber-600">{vendorStats?.gold || 0}</div>
                      <div className="text-xs text-gray-500">Gold (80-89)</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-bold text-gray-600">{vendorStats?.silver || 0}</div>
                      <div className="text-xs text-gray-500">Silver (70-79)</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-xl font-bold text-orange-600">{vendorStats?.bronze || 0}</div>
                      <div className="text-xs text-gray-500">Bronze (&lt;70)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="states">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Coverage by State
                </CardTitle>
                <CardDescription>
                  Orders and vendor coverage across active states
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stateData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="state" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="orders" name="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="vendors" name="Vendors" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {stateData.slice(0, 8).map((state) => (
                    <div key={state.state} className="p-3 border rounded-lg">
                      <div className="font-medium">{state.state}</div>
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>{state.orders} orders</span>
                        <span>{state.vendors} vendors</span>
                      </div>
                      <Badge 
                        variant={state.vendors >= 5 ? "default" : state.vendors > 0 ? "secondary" : "destructive"}
                        className="mt-2"
                      >
                        {state.vendors >= 5 ? "Good Coverage" : state.vendors > 0 ? "Needs More" : "No Coverage"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">{clientStats?.total || 0}</div>
                      <div className="text-sm text-gray-500">Total Clients</div>
                    </div>
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Badge variant="secondary">{clientStats?.active || 0} active</Badge>
                    <Badge className="bg-purple-100 text-purple-800">{clientStats?.pilot || 0} pilot</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-blue-600">{clientStats?.totalOrders || 0}</div>
                      <div className="text-sm text-gray-500">Client Orders</div>
                    </div>
                    <Zap className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="mt-4 text-sm">
                    <span className="text-green-600 font-medium">{clientStats?.completedOrders || 0} completed</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-yellow-600">
                        {clientStats?.avgSatisfaction || 0}%
                      </div>
                      <div className="text-sm text-gray-500">Avg Satisfaction</div>
                    </div>
                    <Award className="h-8 w-8 text-yellow-500" />
                  </div>
                  <Progress value={clientStats?.avgSatisfaction || 0} className="mt-4 bg-yellow-100" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Critical Alert Banner */}
        {(orderStats?.firstPassFundingRate || 0) < 98 && (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div>
                  <h3 className="font-medium text-red-800">
                    First-Pass Funding Rate Below Target
                  </h3>
                  <p className="text-sm text-red-600">
                    Current rate is {orderStats?.firstPassFundingRate || 0}%. 
                    Title companies expect 98%+ for preferred vendor status.
                    Review recent defects and vendor training.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

