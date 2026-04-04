import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { logger } from "@/utils/logger";
import { 
  Phone, 
  Copy, 
  RefreshCw, 
  PhoneCall, 
  PhoneMissed,
  Clock,
  TrendingUp,
  Code
} from "lucide-react";
import { format } from "date-fns";

interface CallEventMetadata {
  source?: string;
  channel?: string;
  [key: string]: string | number | boolean | undefined;
}

interface CallEvent {
  id: string;
  event_type: string;
  tracking_number: string;
  caller_number: string;
  duration?: number;
  created_at: string;
  metadata?: CallEventMetadata;
}

interface TrackingNumber {
  number: string;
  label: string;
  active: boolean;
}

interface CallScalerConfig {
  number_pool: TrackingNumber[];
  default_number: string;
}

const AdminCallScaler = () => {
  const [callEvents, setCallEvents] = useState<CallEvent[]>([]);
  const [config, setConfig] = useState<CallScalerConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newNumber, setNewNumber] = useState({ number: "", label: "" });
  const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch recent call events
      const { data: events } = await supabase
        .from("call_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      setCallEvents((events as CallEvent[]) || []);

      // Fetch CallScaler config
      const { data: configData } = await supabase
        .from("integration_config")
        .select("*")
        .eq("tool", "callscaler")
        .maybeSingle();

      setConfig((configData?.config as unknown as CallScalerConfig) || { number_pool: [], default_number: "" });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching CallScaler data:', errorMessage);
      toast.error("Failed to fetch CallScaler data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/admin/login");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        toast.error("Unauthorized access");
        navigate("/admin/login");
        return;
      }

      fetchData();
    };

    checkAuth();
  }, [navigate]);

  const saveConfig = async () => {
    try {
      const { error } = await supabase
        .from("integration_config")
        .upsert([{
          tool: "callscaler",
          config: JSON.parse(JSON.stringify(config)),
          active: true,
        }]);

      if (error) throw error;
      toast.success("Configuration saved");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error saving CallScaler configuration:', errorMessage);
      toast.error("Failed to save configuration");
    }
  };

  const addTrackingNumber = () => {
    if (!newNumber.number || !newNumber.label) {
      toast.error("Please enter both number and label");
      return;
    }

    const updatedPool = [
      ...(config.number_pool || []),
      { ...newNumber, active: true },
    ];

    setConfig({ ...config, number_pool: updatedPool });
    setNewNumber({ number: "", label: "" });
    toast.success("Number added - don't forget to save!");
  };

  const removeTrackingNumber = (index: number) => {
    if (!config) return;
    const updatedPool = config.number_pool.filter((_, i: number) => i !== index);
    setConfig({ ...config, number_pool: updatedPool });
    toast.success("Number removed - don't forget to save!");
  };

  const copyDNICode = () => {
    const dniCode = `<script src="${import.meta.env.VITE_SUPABASE_URL}/functions/v1/serve-dni-script"></script>`;
    navigator.clipboard.writeText(dniCode);
    toast.success("DNI code copied to clipboard");
  };

  const copyWebhookURL = () => {
    const webhookURL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/callscaler-webhook`;
    navigator.clipboard.writeText(webhookURL);
    toast.success("Webhook URL copied to clipboard");
  };

  // Calculate stats
  const stats = {
    totalCalls: callEvents.length,
    answered: callEvents.filter(e => e.event_type === 'answered').length,
    missed: callEvents.filter(e => e.event_type === 'missed').length,
    avgDuration: Math.round(
      callEvents
        .filter(e => e.duration)
        .reduce((sum, e) => sum + (e.duration || 0), 0) / 
      callEvents.filter(e => e.duration).length || 0
    ),
  };

  const answerRate = stats.totalCalls > 0 
    ? Math.round((stats.answered / stats.totalCalls) * 100) 
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CallScaler Dashboard</h1>
          <p className="text-muted-foreground">Manage call tracking and attribution</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/admin/voice-agent")} variant="secondary">
            Voice Agent
          </Button>
          <Button onClick={() => navigate("/admin/bookings")} variant="secondary">
            Bookings
          </Button>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Answer Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{answerRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.answered} answered, {stats.missed} missed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDuration}s</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tracking Numbers</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{config?.number_pool?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calls" className="w-full">
        <TabsList>
          <TabsTrigger value="calls">Recent Calls</TabsTrigger>
          <TabsTrigger value="numbers">Tracking Numbers</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="calls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Call Events</CardTitle>
              <CardDescription>Last 50 call events from all tracking numbers</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-8 text-muted-foreground">Loading...</p>
              ) : callEvents.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No calls yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Tracking #</TableHead>
                      <TableHead>Caller #</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="text-sm">
                          {format(new Date(event.created_at), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            event.event_type === 'answered' ? 'default' :
                            event.event_type === 'missed' ? 'destructive' : 'secondary'
                          }>
                            {event.event_type === 'answered' && <PhoneCall className="h-3 w-3 mr-1" />}
                            {event.event_type === 'missed' && <PhoneMissed className="h-3 w-3 mr-1" />}
                            {event.event_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{event.tracking_number}</TableCell>
                        <TableCell className="font-mono text-sm">{event.caller_number}</TableCell>
                        <TableCell>{event.duration ? `${event.duration}s` : '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {event.metadata?.source || event.metadata?.channel || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="numbers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Tracking Number</CardTitle>
              <CardDescription>Map phone numbers to marketing channels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Phone Number</Label>
                  <Input
                    id="number"
                    placeholder="(814) 555-0100"
                    value={newNumber.number}
                    onChange={(e) => setNewNumber({ ...newNumber, number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    placeholder="google_ads"
                    value={newNumber.label}
                    onChange={(e) => setNewNumber({ ...newNumber, label: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={addTrackingNumber}>Add Number</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Tracking Numbers</CardTitle>
              <CardDescription>
                {config?.number_pool?.length || 0} numbers configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!config?.number_pool || config.number_pool.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No numbers configured</p>
              ) : (
                <div className="space-y-2">
                  {config.number_pool.map((num: TrackingNumber, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-mono font-medium">{num.number}</p>
                        <p className="text-sm text-muted-foreground">{num.label}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeTrackingNumber(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button onClick={saveConfig} className="w-full">Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook URL</CardTitle>
              <CardDescription>Paste this URL in your CallScaler dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/callscaler-webhook`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={copyWebhookURL} variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure this webhook to receive events: call.started, call.answered, call.missed, call.completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dynamic Number Insertion (DNI)</CardTitle>
              <CardDescription>Add this script to your website's &lt;head&gt; tag</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={`<script src="${import.meta.env.VITE_SUPABASE_URL}/functions/v1/serve-dni-script"></script>`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={copyDNICode} variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-number">Default Phone Number</Label>
                <Input
                  id="default-number"
                  placeholder="(814) 555-0100"
                  value={config?.default_number || ""}
                  onChange={(e) => setConfig({ ...config, default_number: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Shown when no tracking number matches the visitor's source
                </p>
              </div>
              <Button onClick={saveConfig}>Save Default Number</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Code className="h-5 w-5 inline mr-2" />
                How DNI Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>The DNI script automatically swaps phone numbers on your site based on visitor source:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>gclid</strong> parameter → google_ads number</li>
                <li><strong>fbclid</strong> parameter → facebook_ads number</li>
                <li><strong>utm_source=gbp</strong> → google_business_profile number</li>
                <li><strong>utm_campaign</strong> → campaign-specific number</li>
                <li>No match → default number</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCallScaler;
