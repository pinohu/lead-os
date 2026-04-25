import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { CropApplicationStatusUpdate } from '@/types/admin';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, X, Mail, Eye, FileQuestion } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';

interface CropApplication {
  id: string;
  entity_name: string;
  entity_type: string;
  entity_ein: string | null;
  state_of_formation: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  current_address: string;
  mail_handling_preference: string;
  mail_forward_address: string | null;
  selected_plan: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  activated_at: string | null;
}

export default function CropApplications() {
  useAdminAuth();
  
  const [applications, setApplications] = useState<CropApplication[]>([]);
  const [filteredApps, setFilteredApps] = useState<CropApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingApp, setViewingApp] = useState<CropApplication | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredApps(applications);
    } else {
      setFilteredApps(applications.filter(app => app.status === statusFilter));
    }
  }, [statusFilter, applications]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('crop_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
      setFilteredApps(data || []);
    } catch (error) {
      logger.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (id: string, status: string, notify = true) => {
    try {
      const updates: CropApplicationStatusUpdate = { status: status as CropApplicationStatusUpdate['status'], updated_at: new Date().toISOString() };
      
      if (status === 'approved') {
        updates.approved_at = new Date().toISOString();
      }
      if (status === 'active') {
        updates.activated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('crop_applications')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      if (notify) {
        toast.success(`Application ${status}`);
      }
      
      await fetchApplications();
    } catch (error) {
      logger.error('Error updating application:', error);
      toast.error('Failed to update application');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) {
      toast.error('No applications selected');
      return;
    }

    try {
      const promises = Array.from(selectedIds).map(id =>
        updateApplicationStatus(id, 'approved', false)
      );
      await Promise.all(promises);
      toast.success(`${selectedIds.size} applications approved`);
      setSelectedIds(new Set());
    } catch (error) {
      toast.error('Failed to bulk approve');
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) {
      toast.error('No applications selected');
      return;
    }

    try {
      const promises = Array.from(selectedIds).map(id =>
        updateApplicationStatus(id, 'cancelled', false)
      );
      await Promise.all(promises);
      toast.success(`${selectedIds.size} applications cancelled`);
      setSelectedIds(new Set());
    } catch (error) {
      toast.error('Failed to bulk cancel');
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredApps.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApps.map(app => app.id)));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      active: 'default',
      cancelled: 'destructive',
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">CROP Applications</h1>
        <p className="text-muted-foreground">Review and manage registered office applications</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            onClick={handleBulkApprove}
            disabled={selectedIds.size === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Approve Selected ({selectedIds.size})
          </Button>
          <Button
            variant="destructive"
            onClick={handleBulkReject}
            disabled={selectedIds.size === 0}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel Selected ({selectedIds.size})
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === filteredApps.length && filteredApps.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    <span className="text-sm text-muted-foreground">Loading applications...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredApps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12" role="status" aria-live="polite">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <FileQuestion className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-foreground mb-1">
                        {statusFilter === 'all' ? 'No applications found' : `No ${statusFilter} applications`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {statusFilter !== 'all' && 'Try selecting a different status filter or check back later.'}
                        {statusFilter === 'all' && 'CROP applications will appear here once submitted.'}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredApps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(app.id)}
                      onCheckedChange={() => toggleSelection(app.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{app.entity_name}</div>
                    <div className="text-sm text-muted-foreground">{app.entity_type}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{app.contact_person}</div>
                    <div className="text-xs text-muted-foreground">{app.contact_email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{app.selected_plan}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingApp(app)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {app.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateApplicationStatus(app.id, 'approved')}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateApplicationStatus(app.id, 'cancelled')}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      {app.status === 'approved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateApplicationStatus(app.id, 'active')}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!viewingApp} onOpenChange={() => setViewingApp(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Complete information for {viewingApp?.entity_name}
            </DialogDescription>
          </DialogHeader>
          {viewingApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Entity Name</div>
                  <div>{viewingApp.entity_name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Entity Type</div>
                  <div>{viewingApp.entity_type}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">EIN</div>
                  <div>{viewingApp.entity_ein || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">State of Formation</div>
                  <div>{viewingApp.state_of_formation}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Contact Person</div>
                    <div>{viewingApp.contact_person}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Email</div>
                    <div>{viewingApp.contact_email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Phone</div>
                    <div>{viewingApp.contact_phone}</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Address & Mail Handling</h3>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Current Address</div>
                    <div>{viewingApp.current_address}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Mail Preference</div>
                    <div>{viewingApp.mail_handling_preference}</div>
                  </div>
                  {viewingApp.mail_forward_address && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Forward Address</div>
                      <div>{viewingApp.mail_forward_address}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Plan & Payment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Selected Plan</div>
                    <div>{viewingApp.selected_plan}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Status</div>
                    <div>{getStatusBadge(viewingApp.status)}</div>
                  </div>
                  {viewingApp.stripe_subscription_id && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Subscription ID</div>
                      <div className="text-xs font-mono">{viewingApp.stripe_subscription_id}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 flex gap-2 justify-end">
                {viewingApp.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => {
                        updateApplicationStatus(viewingApp.id, 'approved');
                        setViewingApp(null);
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        updateApplicationStatus(viewingApp.id, 'cancelled');
                        setViewingApp(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
                {viewingApp.status === 'approved' && (
                  <Button
                    onClick={() => {
                      updateApplicationStatus(viewingApp.id, 'active');
                      setViewingApp(null);
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Activate
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
