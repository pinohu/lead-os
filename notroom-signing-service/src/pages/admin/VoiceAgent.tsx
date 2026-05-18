import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Phone, Bot, CheckCircle, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { logger } from '@/utils/logger';

interface VoiceAgentConfig {
  voice?: string;
  language?: string;
  transferNumber?: string;
  confidenceThreshold?: number;
  [key: string]: unknown;
}

interface VoiceAgentIntent {
  name: string;
  description?: string;
  fields?: { name: string; type: string }[];
}

interface AgentConfig {
  id: string;
  provider: string;
  config: VoiceAgentConfig;
  intents: VoiceAgentIntent[];
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface VoiceAgentBooking {
  id: string;
  name: string;
  phone: string;
  service: string;
  status: string;
  created_at: string;
  ai_confidence: number | null;
  agent_provider: string | null;
}

export default function VoiceAgent() {
  useAdminAuth();
  
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [bookings, setBookings] = useState<VoiceAgentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('agent_configs')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setConfig(data as unknown as AgentConfig | null);
    } catch (error) {
      logger.error('Error loading config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load agent configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadBookings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, name, phone, service, ai_confidence, agent_provider, created_at, status')
        .eq('ai_booked', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setBookings((data as VoiceAgentBooking[]) || []);
    } catch (error) {
      logger.error('Error loading bookings:', error);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    loadBookings();
  }, [loadConfig, loadBookings]);

  const saveConfig = useCallback(async () => {
    if (!config) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('agent_configs')
        .update({
          config: JSON.parse(JSON.stringify(config.config)),
          intents: JSON.parse(JSON.stringify(config.intents)),
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id);

      if (error) throw error;

      toast({
        title: 'Saved',
        description: 'Agent configuration updated successfully'
      });
    } catch (error) {
      logger.error('Error saving config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  }, [config, toast]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const avgConfidence = useMemo(() => {
    if (bookings.length === 0) return '0.00';
    return (bookings.reduce((sum, b) => sum + (b.ai_confidence || 0), 0) / bookings.length).toFixed(2);
  }, [bookings]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8" />
            Voice AI System
          </h1>
          <p className="text-muted-foreground">Inbound call answering (Insighto) + Outbound calling (Thoughtly)</p>
        </div>
        <Button onClick={() => window.location.href = '/admin/bookings'} variant="outline">
          View All Bookings
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">AI Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground">Last 20 calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(parseFloat(avgConfidence) * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Booking accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{config?.provider || 'None'}</div>
            <p className="text-xs text-muted-foreground">Active agent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {config?.is_active ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium">Inactive</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inbound" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inbound">📞 Inbound (Insighto)</TabsTrigger>
          <TabsTrigger value="outbound">📤 Outbound (Thoughtly)</TabsTrigger>
          <TabsTrigger value="intents">Intents</TabsTrigger>
          <TabsTrigger value="bookings">Recent Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="inbound" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inbound Call Answering - Insighto.AI</CardTitle>
              <CardDescription>24/7 automated receptionist that answers calls and creates bookings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Setup Instructions:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Create an Assistant in your Insighto dashboard</li>
                  <li>Configure intents (NOTARY_NOW, APOSTILLE, FORMATION, etc.)</li>
                  <li>Go to Settings → Webhooks → Add the URL below</li>
                  <li>Edit Assistant → Advanced → Connect webhook</li>
                  <li>Purchase a phone number and route to your assistant</li>
                </ol>
              </div>

              <div className="space-y-2">
                <Label>Webhook URL (Paste in Insighto)</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`https://brzeuhnscuanypkoqcru.supabase.co/functions/v1/agent-booking-handler`}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://brzeuhnscuanypkoqcru.supabase.co/functions/v1/agent-booking-handler`);
                      toast({ title: 'Copied', description: 'Webhook URL copied to clipboard' });
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">

                <div className="space-y-2">
                  <Label>Voice (Insighto Setting)</Label>
                  <Input
                    value={config?.config.voice || ''}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      config: { ...prev.config, voice: e.target.value }
                    } : null)}
                    placeholder="professional"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Input
                    value={config?.config.language || ''}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      config: { ...prev.config, language: e.target.value }
                    } : null)}
                    placeholder="en-US"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Transfer Number (Low Confidence)</Label>
                  <Input
                    value={config?.config.transferNumber || ''}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      config: { ...prev.config, transferNumber: e.target.value }
                    } : null)}
                    placeholder="+18145550100"
                  />
                  <p className="text-xs text-muted-foreground">Human fallback when AI isn't confident</p>
                </div>

                <div className="space-y-2">
                  <Label>Confidence Threshold</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={config?.config.confidenceThreshold || 0.6}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      config: { ...prev.config, confidenceThreshold: parseFloat(e.target.value) }
                    } : null)}
                  />
                  <p className="text-xs text-muted-foreground">Below this, calls transfer to human</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={saveConfig} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outbound" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outbound Calling - Thoughtly</CardTitle>
              <CardDescription>Proactive calls for missed call recovery, follow-ups, and reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Use Cases:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Missed call recovery (automatic callback within minutes)</li>
                  <li>Appointment reminders (24h and 2h before)</li>
                  <li>Follow-up calls after service completion</li>
                  <li>Renewal notifications for annual filings</li>
                  <li>Upsell campaigns (LLC formation after notarization)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label>Thoughtly API Configuration</Label>
                <p className="text-sm text-muted-foreground">
                  Thoughtly calls are triggered via API (not webhooks). Configure agents in your Thoughtly dashboard, then trigger calls from your automation workflows.
                </p>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">Example: Missed Call Recovery</h4>
                <code className="block text-xs bg-muted p-3 rounded">
                  POST /api/thoughtly/trigger-call
                  <br />
                  {`{ "contact_id": "...", "agent_id": "...", "metadata": {...} }`}
                </code>
                <p className="text-xs text-muted-foreground">
                  Triggered automatically when CallScaler detects a missed call
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => window.open('https://docs.thoughtly.com/developers', '_blank')} variant="outline">
                  View Thoughtly Docs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Intents</CardTitle>
              <CardDescription>Define what the agent can understand and handle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config?.intents.map((intent, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{intent.name}</h4>
                    <Badge variant="outline">{intent.fields.length} fields</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{intent.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {intent.fields?.map((field, fieldIdx) => (
                      <Badge key={fieldIdx} variant="secondary">{field.name}: {field.type}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent AI Bookings</CardTitle>
              <CardDescription>Last 20 bookings created by voice agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{booking.name}</p>
                      <p className="text-sm text-muted-foreground">{booking.phone} • {booking.service}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={booking.ai_confidence > 0.7 ? 'default' : 'secondary'}>
                        {(booking.ai_confidence * 100).toFixed(0)}% confident
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
