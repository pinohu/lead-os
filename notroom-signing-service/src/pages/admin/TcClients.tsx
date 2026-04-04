import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { TcClientStatusUpdate } from '@/types/admin';
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
import { Check, X, Eye, FileQuestion, Calendar, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';

interface TcClient {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  business_name: string | null;
  transaction_type: string;
  transaction_description: string;
  parties_involved: string[];
  key_documents: string[] | null;
  target_completion_date: string | null;
  urgency_level: string;
  selected_plan: string;
  status: string;
  coordinator_assigned: string | null;
  current_phase: string | null;
  stripe_customer_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export default function TcClients() {
  useAdminAuth();
  
  const [clients, setClients] = useState<TcClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<TcClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingClient, setViewingClient] = useState<TcClient | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredClients(clients);
    } else {
      setFilteredClients(clients.filter(client => client.status === statusFilter));
    }
  }, [statusFilter, clients]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('tc_clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
      setFilteredClients(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching TC clients:', errorMessage);
      toast.error('Failed to load transaction coordination clients');
    } finally {
      setLoading(false);
    }
  };

  const updateClientStatus = async (id: string, status: string, notify = true) => {
    try {
      const updates: TcClientStatusUpdate = { status: status as TcClientStatusUpdate['status'], updated_at: new Date().toISOString() };
      
      if (status === 'active') {
        updates.started_at = new Date().toISOString();
      }
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      if (status === 'cancelled') {
        updates.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tc_clients')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      if (notify) {
        toast.success(`Client status updated to ${status}`);
      }
      
      await fetchClients();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating client:', errorMessage);
      toast.error('Failed to update client status');
    }
  };

  const handleBulkUpdate = async (status: string) => {
    if (selectedIds.size === 0) {
      toast.error('No clients selected');
      return;
    }

    try {
      const promises = Array.from(selectedIds).map(id =>
        updateClientStatus(id, status, false)
      );
      await Promise.all(promises);
      toast.success(`${selectedIds.size} clients updated to ${status}`);
      setSelectedIds(new Set());
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error bulk updating clients:', errorMessage);
      toast.error('Failed to bulk update');
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
    if (selectedIds.size === filteredClients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClients.map(client => client.id)));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      active: 'default',
      completed: 'default',
      cancelled: 'destructive',
      on_hold: 'outline',
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      real_estate: 'Real Estate',
      business_sale: 'Business Sale',
      merger_acquisition: 'Merger & Acquisition',
      contract_negotiation: 'Contract Negotiation',
      settlement: 'Settlement',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors: Record<string, string> = {
      standard: 'bg-blue-500',
      expedited: 'bg-yellow-500',
      rush: 'bg-red-500',
    };
    return (
      <Badge className={`${colors[urgency] || 'bg-gray-500'} text-white`}>
        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading transaction coordination clients...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Transaction Coordination Clients</h1>
          <p className="text-muted-foreground">
            Manage transaction coordination service clients and their transactions
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>

            {selectedIds.size > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkUpdate('active')}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark Active ({selectedIds.size})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkUpdate('completed')}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark Completed ({selectedIds.size})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkUpdate('cancelled')}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel ({selectedIds.size})
                </Button>
              </div>
            )}
          </div>

          <Button onClick={fetchClients} variant="outline">
            Refresh
          </Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === filteredClients.length && filteredClients.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Transaction Type</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                      <span className="text-sm text-muted-foreground">Loading clients...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12" role="status" aria-live="polite">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <FileQuestion className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-foreground mb-1">
                          {statusFilter === 'all' ? 'No transaction coordination clients found' : `No ${statusFilter} clients`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {statusFilter !== 'all' && 'Try selecting a different status filter or check back later.'}
                          {statusFilter === 'all' && 'Transaction coordination clients will appear here once applications are submitted.'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(client.id)}
                        onCheckedChange={() => toggleSelection(client.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.client_name}</div>
                        <div className="text-sm text-muted-foreground">{client.client_email}</div>
                        {client.business_name && (
                          <div className="text-xs text-muted-foreground">{client.business_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getTransactionTypeLabel(client.transaction_type)}</div>
                        {client.parties_involved && client.parties_involved.length > 0 && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {client.parties_involved.length} {client.parties_involved.length === 1 ? 'party' : 'parties'}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.selected_plan.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      {getUrgencyBadge(client.urgency_level)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(client.status)}
                      {client.coordinator_assigned && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Coordinator: {client.coordinator_assigned}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDistanceToNow(new Date(client.created_at), { addSuffix: true })}
                      </div>
                      {client.target_completion_date && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          Target: {new Date(client.target_completion_date).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingClient(client)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {client.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateClientStatus(client.id, 'active')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {client.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateClientStatus(client.id, 'completed')}
                          >
                            Complete
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

        {/* Detail Dialog */}
        <Dialog open={!!viewingClient} onOpenChange={() => setViewingClient(null)}>
          {viewingClient && (
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Transaction Coordination Client Details</DialogTitle>
                <DialogDescription>
                  Client ID: {viewingClient.id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Client Information */}
                <div>
                  <h3 className="font-semibold mb-3">Client Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <div className="font-medium">{viewingClient.client_name}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <div className="font-medium">{viewingClient.client_email}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <div className="font-medium">{viewingClient.client_phone}</div>
                    </div>
                    {viewingClient.business_name && (
                      <div>
                        <span className="text-muted-foreground">Business:</span>
                        <div className="font-medium">{viewingClient.business_name}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction Details */}
                <div>
                  <h3 className="font-semibold mb-3">Transaction Details</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <div className="font-medium">{getTransactionTypeLabel(viewingClient.transaction_type)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Description:</span>
                      <div className="font-medium mt-1">{viewingClient.transaction_description}</div>
                    </div>
                    {viewingClient.parties_involved && viewingClient.parties_involved.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Parties Involved:</span>
                        <ul className="list-disc list-inside mt-1">
                          {viewingClient.parties_involved.map((party, idx) => (
                            <li key={idx}>{party}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {viewingClient.key_documents && viewingClient.key_documents.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Key Documents:</span>
                        <ul className="list-disc list-inside mt-1">
                          {viewingClient.key_documents.map((doc, idx) => (
                            <li key={idx}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {viewingClient.target_completion_date && (
                        <div>
                          <span className="text-muted-foreground">Target Completion:</span>
                          <div className="font-medium">
                            {new Date(viewingClient.target_completion_date).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Urgency:</span>
                        <div>{getUrgencyBadge(viewingClient.urgency_level)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Information */}
                <div>
                  <h3 className="font-semibold mb-3">Service Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Plan:</span>
                      <div className="font-medium">{viewingClient.selected_plan.toUpperCase()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div>{getStatusBadge(viewingClient.status)}</div>
                    </div>
                    {viewingClient.coordinator_assigned && (
                      <div>
                        <span className="text-muted-foreground">Coordinator:</span>
                        <div className="font-medium">{viewingClient.coordinator_assigned}</div>
                      </div>
                    )}
                    {viewingClient.current_phase && (
                      <div>
                        <span className="text-muted-foreground">Current Phase:</span>
                        <div className="font-medium">{viewingClient.current_phase.replace('_', ' ').toUpperCase()}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamps */}
                <div>
                  <h3 className="font-semibold mb-3">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <div>{new Date(viewingClient.created_at).toLocaleString()}</div>
                    </div>
                    {viewingClient.started_at && (
                      <div>
                        <span className="text-muted-foreground">Started:</span>
                        <div>{new Date(viewingClient.started_at).toLocaleString()}</div>
                      </div>
                    )}
                    {viewingClient.completed_at && (
                      <div>
                        <span className="text-muted-foreground">Completed:</span>
                        <div>{new Date(viewingClient.completed_at).toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      if (viewingClient.status === 'pending') {
                        updateClientStatus(viewingClient.id, 'active');
                      } else if (viewingClient.status === 'active') {
                        updateClientStatus(viewingClient.id, 'completed');
                      }
                      setViewingClient(null);
                    }}
                    disabled={viewingClient.status === 'completed' || viewingClient.status === 'cancelled'}
                  >
                    {viewingClient.status === 'pending' ? 'Activate' : viewingClient.status === 'active' ? 'Mark Complete' : 'N/A'}
                  </Button>
                  {viewingClient.status !== 'cancelled' && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        updateClientStatus(viewingClient.id, 'cancelled');
                        setViewingClient(null);
                      }}
                    >
                      Cancel Transaction
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </div>
  );
}

