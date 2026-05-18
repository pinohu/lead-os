import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Phone, MessageSquare, Check, AlertTriangle, Play, RefreshCw } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { logger } from "@/utils/logger";
interface CallEvent {
  id: string;
  booking_id: string | null;
  caller_number: string | null;
  created_at: string | null;
  duration: number | null;
  event_type: string;
  metadata: Record<string, unknown> | null;
  recording_url: string | null;
  tool: string;
  tracking_number: string | null;
  transcript: string | null;
  bookings?: {
    id: string;
    name: string;
    phone: string;
    service: string;
  };
}

export default function AutomationFlows() {
  useAdminAuth();
  
  const [events, setEvents] = useState<CallEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [testPhone, setTestPhone] = useState("");
  const [testBookingId, setTestBookingId] = useState("");
  const { toast } = useToast();

  const loadRecentEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('call_events')
        .select('*, bookings(id, name, phone, service)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEvents(data as CallEvent[] || []);
    } catch (error) {
      logger.error('Error loading events:', error);
      toast({
        title: "Error loading events",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRecentEvents();
  }, [loadRecentEvents]);

  const testMissedCallFlow = useCallback(async () => {
    if (!testPhone && !testBookingId) {
      toast({
        title: "Missing input",
        description: "Please provide either a phone number or booking ID",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('smsit-missed-call', {
        body: { 
          leadId: testBookingId || null,
          callerNumber: testPhone || null,
        }
      });

      if (error) throw error;

      toast({
        title: "✅ Missed Call Flow Triggered",
        description: "SMS sent successfully. Check the events log below.",
      });

      loadRecentEvents();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error triggering missed call flow:', errorMessage);
      toast({
        title: "Failed to trigger flow",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [testPhone, testBookingId, toast, loadRecentEvents]);

  const testBookingConfirmation = useCallback(async () => {
    if (!testBookingId) {
      toast({
        title: "Missing booking ID",
        description: "Please provide a booking ID to test",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('smsit-booking-confirm', {
        body: { bookingId: testBookingId }
      });

      if (error) throw error;

      toast({
        title: "✅ Booking Confirmation Sent",
        description: "SMS confirmation sent successfully.",
      });

      loadRecentEvents();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error sending booking confirmation:', errorMessage);
      toast({
        title: "Failed to send confirmation",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [testBookingId, toast, loadRecentEvents]);

  const testWhatsAppChecklist = useCallback(async () => {
    if (!testBookingId) {
      toast({
        title: "Missing booking ID",
        description: "Please provide a booking ID to test",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get booking details first
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('phone, service')
        .eq('id', testBookingId)
        .single();

      if (bookingError) throw bookingError;

      const { data, error } = await supabase.functions.invoke('wbiztool-send-checklist', {
        body: { 
          bookingId: testBookingId,
          phone: booking.phone,
          service: booking.service,
        }
      });

      if (error) throw error;

      toast({
        title: "✅ WhatsApp Checklist Sent",
        description: "Document checklist sent via WhatsApp.",
      });

      loadRecentEvents();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error sending WhatsApp checklist:', errorMessage);
      toast({
        title: "Failed to send WhatsApp",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [testBookingId, toast, loadRecentEvents]);

  const getEventIcon = useMemo(() => (eventType: string) => {
    if (eventType.includes('call')) return <Phone className="h-4 w-4" />;
    if (eventType.includes('sms') || eventType.includes('whatsapp')) return <MessageSquare className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  }, []);

  const getEventBadge = useMemo(() => (tool: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      callscaler: "default",
      insighto: "secondary",
      smsit: "default",
      wbiztool: "secondary",
    };
    return <Badge variant={variants[tool] || "outline"}>{tool}</Badge>;
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Automation Flows</h1>
        <p className="text-muted-foreground">
          Monitor and test CallScaler, Insighto, SMS-iT, and WbizTool integrations
        </p>
      </div>

      <Tabs defaultValue="monitor" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="monitor">Event Monitor</TabsTrigger>
          <TabsTrigger value="test">Test Flows</TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recent Events</h2>
            <Button onClick={loadRecentEvents} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="p-6">Loading events...</CardContent>
              </Card>
            ) : events.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No events yet. Test a flow to see events appear here.
                </CardContent>
              </Card>
            ) : (
              events.map((event) => (
                <Card key={event.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-muted rounded-lg">
                          {getEventIcon(event.event_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{event.event_type}</span>
                            {getEventBadge(event.tool)}
                          </div>
                          {event.bookings && (
                            <div className="text-sm text-muted-foreground">
                              {event.bookings.name} • {event.bookings.phone} • {event.bookings.service}
                            </div>
                          )}
                          {event.caller_number && (
                            <div className="text-sm text-muted-foreground">
                              Caller: {event.caller_number}
                            </div>
                          )}
                          {event.tracking_number && (
                            <div className="text-sm text-muted-foreground">
                              Tracking: {event.tracking_number}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(event.created_at).toLocaleString()}
                      </div>
                    </div>
                    {event.transcript && (
                      <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                        <strong>Transcript:</strong>
                        <p className="mt-1 text-muted-foreground">{event.transcript}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Missed Call Flow</CardTitle>
              <CardDescription>
                Triggers SMS-iT missed call recovery automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testPhone">Phone Number (optional if booking ID provided)</Label>
                <Input
                  id="testPhone"
                  placeholder="+1 814-555-0100"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="testBookingId">Booking ID (optional if phone provided)</Label>
                <Input
                  id="testBookingId"
                  placeholder="uuid-here"
                  value={testBookingId}
                  onChange={(e) => setTestBookingId(e.target.value)}
                />
              </div>
              <Button onClick={testMissedCallFlow} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Trigger Missed Call SMS
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Booking Confirmation</CardTitle>
              <CardDescription>
                Sends SMS confirmation for a booking via SMS-iT
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="confirmBookingId">Booking ID</Label>
                <Input
                  id="confirmBookingId"
                  placeholder="uuid-here"
                  value={testBookingId}
                  onChange={(e) => setTestBookingId(e.target.value)}
                />
              </div>
              <Button onClick={testBookingConfirmation} className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Confirmation SMS
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test WhatsApp Checklist</CardTitle>
              <CardDescription>
                Sends document checklist via WbizTool WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="waBookingId">Booking ID</Label>
                <Input
                  id="waBookingId"
                  placeholder="uuid-here"
                  value={testBookingId}
                  onChange={(e) => setTestBookingId(e.target.value)}
                />
              </div>
              <Button onClick={testWhatsAppChecklist} className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send WhatsApp Checklist
              </Button>
            </CardContent>
          </Card>

          <Card className="border-amber-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Webhook URLs
              </CardTitle>
              <CardDescription>
                Configure these URLs in your external services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 font-mono text-sm">
              <div>
                <strong>CallScaler:</strong>
                <div className="bg-muted p-2 rounded mt-1 break-all">
                  {import.meta.env.VITE_SUPABASE_URL}/functions/v1/callscaler-webhook
                </div>
              </div>
              <div>
                <strong>Insighto:</strong>
                <div className="bg-muted p-2 rounded mt-1 break-all">
                  {import.meta.env.VITE_SUPABASE_URL}/functions/v1/insighto-webhook
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
