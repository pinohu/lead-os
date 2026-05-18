import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Send, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const WhatsAppConfig = () => {
  useAdminAuth();
  
  const { toast } = useToast();
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateParams, setTemplateParams] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendTestMessage = useCallback(async () => {
    if (!testPhone || !testMessage) {
      toast({
        title: "Missing Information",
        description: "Please enter both phone number and message",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('wbiztool-send-whatsapp', {
        body: {
          phone: testPhone,
          message: testMessage,
        }
      });

      if (error) throw error;

      toast({
        title: "WhatsApp Message Sent",
        description: "Test message sent successfully via WhatsApp",
      });

      setTestMessage("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('WhatsApp send error:', errorMessage);
      toast({
        title: "Failed to Send",
        description: errorMessage || "Failed to send WhatsApp message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }, [testPhone, testMessage, toast]);

  const handleSendTemplate = useCallback(async () => {
    if (!testPhone || !templateName) {
      toast({
        title: "Missing Information",
        description: "Please enter phone number and template name",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const params = templateParams ? templateParams.split(',').map(p => p.trim()) : [];

      const { data, error } = await supabase.functions.invoke('wbiztool-send-template', {
        body: {
          phone: testPhone,
          templateName: templateName,
          templateParams: params,
          languageCode: 'en',
        }
      });

      if (error) throw error;

      toast({
        title: "Template Sent",
        description: "WhatsApp template sent successfully",
      });

      setTemplateName("");
      setTemplateParams("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Template send error:', errorMessage);
      toast({
        title: "Failed to Send Template",
        description: errorMessage || "Failed to send WhatsApp template",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }, [testPhone, templateName, templateParams, toast]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">WhatsApp Configuration</h1>
        <p className="text-muted-foreground">
          Manage WhatsApp Business messaging via WbizTool integration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WhatsApp Setup Guide
          </CardTitle>
          <CardDescription>
            Configure WhatsApp Business API through WbizTool
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold">Setup Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <strong>Get WbizTool Account</strong>
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>Sign up at <a href="https://wbiztool.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">wbiztool.com</a></li>
                  <li>Verify your business with Meta</li>
                  <li>Get your WhatsApp Business Phone Number ID</li>
                  <li>Generate API access token</li>
                </ul>
              </li>
              <li>
                <strong>Configure Credentials</strong>
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>Add <code className="bg-muted px-1 py-0.5 rounded">WBIZTOOL_API_KEY</code> in Cloud Secrets</li>
                  <li>Add <code className="bg-muted px-1 py-0.5 rounded">WBIZTOOL_PHONE_NUMBER_ID</code> in Cloud Secrets</li>
                </ul>
              </li>
              <li>
                <strong>Create Message Templates</strong>
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>Go to WbizTool dashboard → Templates</li>
                  <li>Create approved templates for: booking confirmations, reminders, follow-ups</li>
                  <li>Templates must be approved by Meta before use</li>
                </ul>
              </li>
              <li>
                <strong>Test Integration</strong>
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>Use the test tools below to verify setup</li>
                  <li>Check WhatsApp message delivery</li>
                  <li>Verify template rendering</li>
                </ul>
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📋 Recommended Templates
            </h4>
            <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
              <li>• <strong>booking_confirmation</strong> - New booking confirmation</li>
              <li>• <strong>appointment_reminder_48h</strong> - 48-hour reminder</li>
              <li>• <strong>appointment_reminder_24h</strong> - 24-hour reminder</li>
              <li>• <strong>appointment_reminder_2h</strong> - 2-hour reminder</li>
              <li>• <strong>rating_request</strong> - Post-service feedback request</li>
              <li>• <strong>follow_up</strong> - General follow-up message</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="message" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="message">
            <Send className="h-4 w-4 mr-2" />
            Test Message
          </TabsTrigger>
          <TabsTrigger value="template">
            <FileText className="h-4 w-4 mr-2" />
            Test Template
          </TabsTrigger>
        </TabsList>

        <TabsContent value="message">
          <Card>
            <CardHeader>
              <CardTitle>Send Test WhatsApp Message</CardTitle>
              <CardDescription>
                Send a test message to verify your WhatsApp integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testPhone">Phone Number (with country code)</Label>
                <Input
                  id="testPhone"
                  placeholder="+1234567890"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="testMessage">Message</Label>
                <Textarea
                  id="testMessage"
                  placeholder="Hello! This is a test message from NotaryFlow."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleSendTestMessage} 
                disabled={isSending}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? "Sending..." : "Send Test Message"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Send Template Message</CardTitle>
              <CardDescription>
                Test an approved WhatsApp template with variables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="templatePhone">Phone Number (with country code)</Label>
                <Input
                  id="templatePhone"
                  placeholder="+1234567890"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  placeholder="booking_confirmation"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateParams">Template Parameters (comma-separated)</Label>
                <Input
                  id="templateParams"
                  placeholder="John Doe, 2025-02-15, 2:00 PM"
                  value={templateParams}
                  onChange={(e) => setTemplateParams(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter values for template variables, separated by commas
                </p>
              </div>

              <Button 
                onClick={handleSendTemplate} 
                disabled={isSending}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                {isSending ? "Sending..." : "Send Template"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsAppConfig;
