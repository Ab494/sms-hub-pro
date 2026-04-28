import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { adminAPI } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Fingerprint,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Loader2,
  Tag,
  Crown,
  Sparkles,
  Trash2,
  Edit,
  ListChecks,
  Filter,
} from "lucide-react";

interface SenderID {
  _id: string;
  senderId: string;
  name: string;
  description?: string;
  price: number;
  category: "generic" | "premium" | "custom";
  isRegistered: boolean;
  isActive: boolean;
  ownerId?: { _id: string; name: string; email: string } | null;
  purchaseDate?: string;
  expiryDate?: string;
}

interface SenderIDRequest {
  _id: string;
  userId: { _id: string; name: string; email: string };
  requestedSenderId: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  price: number;
  createdAt: string;
}

const statusConfig = {
  pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  approved: { icon: CheckCircle2, color: "bg-green-100 text-green-800", label: "Approved" },
  rejected: { icon: XCircle, color: "bg-red-100 text-red-800", label: "Rejected" },
};

const categoryColors = {
  generic: "bg-emerald-100 text-emerald-700",
  premium: "bg-amber-100 text-amber-700",
  custom: "bg-purple-100 text-purple-700",
};

export default function AdminSenderIdsPage() {
  const [senderIds, setSenderIds] = useState<SenderID[]>([]);
  const [requests, setRequests] = useState<SenderIDRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("requests");
  const [filterStatus, setFilterStatus] = useState("pending");

  // Review dialog state
  const [reviewDialog, setReviewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SenderIDRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDialog, setBulkDialog] = useState<null | "approve" | "reject">(null);
  const [bulkNotes, setBulkNotes] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Add Sender ID dialog state
  const [addDialog, setAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({
    senderId: "",
    name: "",
    description: "",
    price: 6499,
    category: "generic" as "generic" | "premium" | "custom",
    isRegistered: true,
  });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [idsRes, reqsRes] = await Promise.all([
        adminAPI.getSenderIds().catch(() => ({ data: { data: [] } })),
        adminAPI.getSenderIdRequests().catch(() => ({ data: { data: [] } })),
      ]);
      setSenderIds(idsRes.data.data || []);
      setRequests(reqsRes.data.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (request: SenderIDRequest) => {
    setSelectedRequest(request);
    setAdminNotes("");
    setReviewDialog(true);
  };

  const handleAction = async (action: "approve" | "reject") => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      await adminAPI.reviewSenderIdRequest(selectedRequest._id, {
        action,
        adminNotes,
      });
      toast.success(`Request ${action === "approve" ? "approved" : "rejected"} successfully`);
      setReviewDialog(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddSenderId = async () => {
    if (!addForm.senderId.trim() || !addForm.name.trim()) {
      toast.error("Sender ID and name are required");
      return;
    }
    setAdding(true);
    try {
      await adminAPI.createSenderId(addForm);
      toast.success("Sender ID created successfully");
      setAddDialog(false);
      setAddForm({ senderId: "", name: "", description: "", price: 6499, category: "generic", isRegistered: true });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create Sender ID");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteSenderId = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Sender ID?")) return;
    try {
      await adminAPI.deleteSenderId(id);
      toast.success("Sender ID deleted");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    }
  };

  const filteredRequests =
    filterStatus === "all"
      ? requests
      : requests.filter((r) => r.status === filterStatus);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;
  const totalRequests = requests.length;

  // Bulk-selectable rows = pending only (approved/rejected can't be re-reviewed)
  const selectablePendingIds = filteredRequests
    .filter((r) => r.status === "pending")
    .map((r) => r._id);
  const allPendingSelected =
    selectablePendingIds.length > 0 &&
    selectablePendingIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedIds((ids) => ids.filter((id) => !selectablePendingIds.includes(id)));
    } else {
      setSelectedIds((ids) => Array.from(new Set([...ids, ...selectablePendingIds])));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  };

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIds([]);
  }, [filterStatus, activeTab]);

  const handleBulkAction = async () => {
    if (!bulkDialog || selectedIds.length === 0) return;
    setBulkProcessing(true);
    let success = 0;
    let failed = 0;
    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          try {
            await adminAPI.reviewSenderIdRequest(id, {
              action: bulkDialog,
              adminNotes: bulkNotes || undefined,
            });
            success++;
          } catch {
            failed++;
          }
        })
      );
      if (success > 0) {
        toast.success(
          `${success} request${success > 1 ? "s" : ""} ${
            bulkDialog === "approve" ? "approved" : "rejected"
          }${failed > 0 ? ` • ${failed} failed` : ""}`
        );
      } else {
        toast.error("Bulk action failed");
      }
      setBulkDialog(null);
      setBulkNotes("");
      setSelectedIds([]);
      fetchData();
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sender ID Management"
        description="Manage sender IDs and review custom requests from users"
      />

      {/* Summary Widget — clickable status breakdown */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="h-4 w-4 text-primary" />
                Sender ID Requests Summary
              </CardTitle>
              <CardDescription>
                Click a status to filter • {totalRequests} total request{totalRequests === 1 ? "" : "s"}
              </CardDescription>
            </div>
            <Badge variant="outline" className="hidden sm:inline-flex">
              <Fingerprint className="mr-1 h-3 w-3" />
              {senderIds.length} total IDs
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab("requests");
                setFilterStatus("all");
              }}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition hover:border-primary/50 hover:shadow-sm ${
                activeTab === "requests" && filterStatus === "all"
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ListChecks className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalRequests}</p>
                <p className="text-xs text-muted-foreground">All Requests</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("requests");
                setFilterStatus("pending");
              }}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition hover:border-yellow-500/50 hover:shadow-sm ${
                activeTab === "requests" && filterStatus === "pending"
                  ? "border-yellow-500 bg-yellow-500/5"
                  : "border-border"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("requests");
                setFilterStatus("approved");
              }}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition hover:border-green-500/50 hover:shadow-sm ${
                activeTab === "requests" && filterStatus === "approved"
                  ? "border-green-500 bg-green-500/5"
                  : "border-border"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-700 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("requests");
                setFilterStatus("rejected");
              }}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition hover:border-red-500/50 hover:shadow-sm ${
                activeTab === "requests" && filterStatus === "rejected"
                  ? "border-red-500 bg-red-500/5"
                  : "border-border"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-700 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{rejectedCount}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="requests" className="relative">
            <Clock className="mr-2 h-4 w-4" />
            Requests
            {pendingCount > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Tag className="mr-2 h-4 w-4" />
            Inventory
          </TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {filteredRequests.length} shown
              </span>
            </div>

            {/* Bulk action toolbar */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1.5">
                <span className="text-sm font-medium">
                  {selectedIds.length} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedIds([])}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setBulkDialog("reject")}
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  Reject All
                </Button>
                <Button size="sm" onClick={() => setBulkDialog("approve")}>
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Approve All
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No Requests</h3>
                <p className="text-sm text-muted-foreground">
                  {filterStatus === "pending"
                    ? "No pending requests to review."
                    : "No requests found with this filter."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allPendingSelected}
                        onCheckedChange={toggleSelectAll}
                        disabled={selectablePendingIds.length === 0}
                        aria-label="Select all pending"
                      />
                    </TableHead>
                    <TableHead>Sender ID</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req) => {
                    const StatusIcon = statusConfig[req.status].icon;
                    const isPending = req.status === "pending";
                    return (
                      <TableRow
                        key={req._id}
                        className={selectedIds.includes(req._id) ? "bg-muted/30" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(req._id)}
                            onCheckedChange={() => toggleSelectOne(req._id)}
                            disabled={!isPending}
                            aria-label={`Select ${req.requestedSenderId}`}
                          />
                        </TableCell>
                        <TableCell className="font-bold tracking-wider">
                          {req.requestedSenderId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{req.userId?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{req.userId?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {req.reason}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[req.status].color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig[req.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isPending ? (
                            <Button size="sm" onClick={() => handleReview(req)}>
                              Review
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {req.adminNotes || "—"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Sender ID
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sender ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price (KSh)</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {senderIds.map((sid) => (
                    <TableRow key={sid._id}>
                      <TableCell className="font-bold tracking-wider">{sid.senderId}</TableCell>
                      <TableCell>{sid.name}</TableCell>
                      <TableCell>
                        <Badge className={categoryColors[sid.category]}>{sid.category}</Badge>
                      </TableCell>
                      <TableCell>{sid.price.toLocaleString()}</TableCell>
                      <TableCell>
                        {sid.isRegistered ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        {sid.ownerId ? (
                          <span className="text-sm">
                            {typeof sid.ownerId === "object" ? sid.ownerId.name : "Owned"}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Available</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!sid.ownerId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSenderId(sid._id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Sender ID Request</DialogTitle>
            <DialogDescription>
              Approve or reject this custom Sender ID request.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Requested ID</span>
                  <span className="text-lg font-bold tracking-wider">
                    {selectedRequest.requestedSenderId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">User</span>
                  <span className="text-sm font-medium">
                    {selectedRequest.userId?.name} ({selectedRequest.userId?.email})
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Reason</span>
                  <p className="text-sm mt-1">{selectedRequest.reason}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminNotes">Admin Notes (optional)</Label>
                <Textarea
                  id="adminNotes"
                  placeholder="Add notes for the user..."
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => handleAction("reject")}
              disabled={processing}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button onClick={() => handleAction("approve")} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sender ID Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Sender ID</DialogTitle>
            <DialogDescription>
              Create a new Sender ID for the marketplace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Sender ID</Label>
              <Input
                placeholder="e.g., MYBRAND"
                maxLength={11}
                value={addForm.senderId}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    senderId: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                placeholder="e.g., My Brand"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Short description"
                value={addForm.description}
                onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (KSh)</Label>
                <Input
                  type="number"
                  value={addForm.price}
                  onChange={(e) => setAddForm((f) => ({ ...f, price: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={addForm.category}
                  onValueChange={(v: "generic" | "premium" | "custom") =>
                    setAddForm((f) => ({ ...f, category: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic">Generic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSenderId} disabled={adding}>
              {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Sender ID
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Review Dialog */}
      <Dialog open={bulkDialog !== null} onOpenChange={(open) => !open && setBulkDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Bulk {bulkDialog === "approve" ? "Approve" : "Reject"} Requests
            </DialogTitle>
            <DialogDescription>
              You are about to {bulkDialog} <strong>{selectedIds.length}</strong> pending
              request{selectedIds.length === 1 ? "" : "s"}. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="bulkNotes">Admin Notes (applied to all)</Label>
            <Textarea
              id="bulkNotes"
              placeholder="Optional notes shared with users..."
              rows={3}
              value={bulkNotes}
              onChange={(e) => setBulkNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDialog(null)}
              disabled={bulkProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={bulkDialog === "reject" ? "destructive" : "default"}
              onClick={handleBulkAction}
              disabled={bulkProcessing}
            >
              {bulkProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm {bulkDialog === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
