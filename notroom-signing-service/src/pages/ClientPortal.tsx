import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building,
  Mail,
  Download,
  LogOut,
  CreditCard,
  Settings,
  Package,
  Send,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import SEO from '@/components/SEO';
import SigningLayout from '@/components/SigningLayout';
import { formatDistanceToNow } from 'date-fns';

interface CropApplication {
  id: string;
  entity_name: string;
  selected_plan: string;
  status: string;
  created_at: string;
  activated_at: string | null;
}

interface MailItem {
  id: string;
  received_date: string;
  sender_name: string;
  mail_type: string;
  description: string;
  status: string;
  scan_url: string | null;
  scanned_at: string | null;
}

interface Profile {
  display_name: string;
  company_name: string;
  phone: string;
}

export default function ClientPortal() {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [cropApplication, setCropApplication] = useState<CropApplication | null>(null);
  const [mailItems, setMailItems] = useState<MailItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?redirect=/portal');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPortalData();
    }
  }, [user]);

  const fetchPortalData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch CROP application
      const { data: cropData, error: cropError } = await supabase
        .from('crop_applications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cropError && cropError.code !== 'PGRST116') throw cropError;
      setCropApplication(cropData);

      // Fetch mail items
      const { data: mailData, error: mailError } = await supabase
        .from('mail_items')
        .select('*')
        .eq('user_id', user!.id)
        .order('received_date', { ascending: false });

      if (mailError) throw mailError;
      setMailItems(mailData || []);
    } catch (error) {
      logger.error('Error fetching portal data:', error);
      toast.error('Failed to load portal data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      logger.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management');
    }
  };

  const downloadScan = async (mailItem: MailItem) => {
    if (!mailItem.scan_url) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('mail-scans')
        .download(mailItem.scan_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mail-${mailItem.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Error downloading scan:', error);
      toast.error('Failed to download scan');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle },
      active: { variant: 'default', icon: CheckCircle },
      scanned: { variant: 'default', icon: FileText },
      cancelled: { variant: 'destructive', icon: XCircle },
    };
    
    const config = variants[status] || { variant: 'outline', icon: Clock };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your portal...</div>
      </div>
    );
  }

  return (
    <SigningLayout>
      <SEO 
        title="Client Portal Dashboard | Notroom"
        description="Manage your signing orders, view status, and update your account information."
        canonical="/portal"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white pt-24">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.display_name}</h1>
              <p className="text-muted-foreground">{profile?.company_name}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/portal/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* CROP Application Status */}
          {cropApplication && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      CROP Application Status
                    </CardTitle>
                    <CardDescription>{cropApplication.entity_name}</CardDescription>
                  </div>
                  {getStatusBadge(cropApplication.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Plan</div>
                    <div className="font-medium">{cropApplication.selected_plan}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Applied</div>
                    <div className="font-medium">
                      {formatDistanceToNow(new Date(cropApplication.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleManageSubscription}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Manage Subscription
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Tabs */}
          <Tabs defaultValue="mail" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="mail">
                <Mail className="h-4 w-4 mr-2" />
                Mail Items
              </TabsTrigger>
              <TabsTrigger value="forwarding">
                <Send className="h-4 w-4 mr-2" />
                Forwarding
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mail" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Received Mail</CardTitle>
                  <CardDescription>
                    View and download scans of your received mail
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {mailItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground" role="status" aria-live="polite">
                      <Package className="h-16 w-16 mx-auto mb-4 opacity-30" aria-hidden="true" />
                      <p className="text-lg font-medium text-foreground mb-2">No mail items yet</p>
                      <p className="text-sm max-w-md mx-auto">
                        When mail arrives at your registered office address, it will appear here. You'll be notified when new mail is received.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mailItems.map((item) => (
                        <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{item.sender_name || 'Unknown Sender'}</span>
                              {getStatusBadge(item.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">{item.description}</p>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>Type: {item.mail_type}</span>
                              <span>Received: {new Date(item.received_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {item.scan_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadScan(item)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="forwarding">
              <Card>
                <CardHeader>
                  <CardTitle>Mail Forwarding</CardTitle>
                  <CardDescription>
                    Request to have your mail forwarded to a different address
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">Forwarding request feature coming soon</p>
                    <Button onClick={() => navigate('/track-booking')}>
                      Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SigningLayout>
  );
}
