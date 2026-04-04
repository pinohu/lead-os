import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { logger } from "@/utils/logger";
import { LogOut, RefreshCw, Upload, Mail, Package, FileText, Eye } from "lucide-react";
import { format } from "date-fns";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface MailItem {
  id: string;
  user_id: string;
  crop_application_id: string | null;
  sender_name: string | null;
  sender_address: string | null;
  mail_type: string;
  description: string | null;
  scan_url: string | null;
  status: string;
  received_date: string;
  weight_oz: number | null;
  dimensions: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string | null;
}

interface Profile {
  id: string;
  display_name: string | null;
  company_name: string | null;
}

const MAIL_TYPES = [
  { value: "letter", label: "Letter", icon: Mail },
  { value: "package", label: "Package", icon: Package },
  { value: "legal", label: "Legal Document", icon: FileText },
  { value: "government", label: "Government", icon: FileText },
  { value: "financial", label: "Financial", icon: FileText },
  { value: "other", label: "Other", icon: Mail },
];

const AdminMailUploads = () => {
  useAdminAuth();

  const navigate = useNavigate();
  const [mailItems, setMailItems] = useState<MailItem[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [mailType, setMailType] = useState("letter");
  const [description, setDescription] = useState("");
  const [weightOz, setWeightOz] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [notes, setNotes] = useState("");
  const [scanFile, setScanFile] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mailResult, profilesResult] = await Promise.all([
        supabase
          .from("mail_items")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("id, display_name, company_name")
      ]);

      if (mailResult.error) throw mailResult.error;
      if (profilesResult.error) throw profilesResult.error;

      setMailItems(mailResult.data || []);
      setProfiles(profilesResult.data || []);
    } catch (error) {
      logger.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setSelectedUserId("");
    setSenderName("");
    setSenderAddress("");
    setMailType("letter");
    setDescription("");
    setWeightOz("");
    setDimensions("");
    setNotes("");
    setScanFile(null);
  };

  const handleUpload = async () => {
    if (!selectedUserId) {
      toast.error("Please select a client");
      return;
    }

    setIsUploading(true);
    try {
      let scanUrl: string | null = null;

      // Upload scan file if provided
      if (scanFile) {
        const fileExt = scanFile.name.split(".").pop();
        const fileName = `${selectedUserId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("mail-scans")
          .upload(fileName, scanFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("mail-scans")
          .getPublicUrl(fileName);

        scanUrl = urlData.publicUrl;
      }

      // Create mail item record
      const { error: insertError } = await supabase.from("mail_items").insert({
        user_id: selectedUserId,
        sender_name: senderName || null,
        sender_address: senderAddress || null,
        mail_type: mailType,
        description: description || null,
        scan_url: scanUrl,
        weight_oz: weightOz ? parseFloat(weightOz) : null,
        dimensions: dimensions || null,
        notes: notes || null,
        status: scanUrl ? "scanned" : "pending",
        scanned_at: scanUrl ? new Date().toISOString() : null,
      });

      if (insertError) throw insertError;

      toast.success("Mail item added successfully");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      logger.error("Error uploading mail:", error);
      toast.error("Failed to add mail item");
    } finally {
      setIsUploading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const updateData: Record<string, unknown> = { status };
      if (status === "forwarded") {
        updateData.forwarded_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("mail_items")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      setMailItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
      toast.success("Status updated");
    } catch (error) {
      logger.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const getClientName = (userId: string) => {
    const profile = profiles.find((p) => p.id === userId);
    return profile?.company_name || profile?.display_name || "Unknown Client";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber text-amber-foreground",
      scanned: "bg-primary text-primary-foreground",
      forwarded: "bg-success text-success-foreground",
      held: "bg-muted text-muted-foreground",
    };
    return colors[status] || "bg-muted";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">Mail Management</CardTitle>
              <div className="flex gap-2">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="w-4 h-4 mr-2" />
                      Add Mail Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add New Mail Item</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Client *</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            {profiles.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.company_name || profile.display_name || "Unnamed"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Sender Name</Label>
                          <Input
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            placeholder="IRS, Bank of America..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Mail Type</Label>
                          <Select value={mailType} onValueChange={setMailType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover">
                              {MAIL_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Sender Address</Label>
                        <Input
                          value={senderAddress}
                          onChange={(e) => setSenderAddress(e.target.value)}
                          placeholder="123 Main St, City, ST 12345"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Brief description of the mail item..."
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Weight (oz)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={weightOz}
                            onChange={(e) => setWeightOz(e.target.value)}
                            placeholder="1.5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Dimensions</Label>
                          <Input
                            value={dimensions}
                            onChange={(e) => setDimensions(e.target.value)}
                            placeholder="6x9 envelope"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Scan File (PDF/Image)</Label>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setScanFile(e.target.files?.[0] || null)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Admin Notes</Label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Internal notes..."
                          rows={2}
                        />
                      </div>

                      <Button
                        onClick={handleUpload}
                        disabled={isUploading || !selectedUserId}
                        className="w-full"
                      >
                        {isUploading ? "Uploading..." : "Add Mail Item"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchData}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading mail items...</div>
            ) : mailItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No mail items found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Received</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Scan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mailItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(item.received_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {getClientName(item.user_id)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{item.sender_name || "Unknown"}</div>
                            {item.sender_address && (
                              <div className="text-muted-foreground text-xs truncate max-w-[150px]">
                                {item.sender_address}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.mail_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {item.description || "-"}
                        </TableCell>
                        <TableCell>
                          {item.scan_url ? (
                            <a
                              href={item.scan_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-primary hover:underline"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.status}
                            onValueChange={(value) => updateStatus(item.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="scanned">Scanned</SelectItem>
                              <SelectItem value="forwarded">Forwarded</SelectItem>
                              <SelectItem value="held">Held</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMailUploads;
