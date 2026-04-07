import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { senderIdAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Fingerprint,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Tag,
  Crown,
  Sparkles,
  Send,
  Loader2,
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
  ownerId?: string;
}

interface SenderIDRequest {
  _id: string;
  requestedSenderId: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  createdAt: string;
}

const categoryIcons = {
  generic: Tag,
  premium: Crown,
  custom: Sparkles,
};

const categoryColors = {
  generic: "bg-emerald-100 text-emerald-700 border-emerald-200",
  premium: "bg-amber-100 text-amber-700 border-amber-200",
  custom: "bg-purple-100 text-purple-700 border-purple-200",
};

const statusConfig = {
  pending: { icon: Clock, color: "bg-yellow-100 text-yellow-700", label: "Pending Review" },
  approved: { icon: CheckCircle2, color: "bg-green-100 text-green-700", label: "Approved" },
  rejected: { icon: XCircle, color: "bg-red-100 text-red-700", label: "Rejected" },
};

export default function SenderIdPage() {
  const { user } = useAuth();
  const [availableIds, setAvailableIds] = useState<SenderID[]>([]);
  const [myRequests, setMyRequests] = useState<SenderIDRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Request form state
  const [requestForm, setRequestForm] = useState({
    senderId: "",
    reason: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [availableRes, requestsRes] = await Promise.all([
        senderIdAPI.getAvailable().catch(() => ({ data: { data: [] } })),
        senderIdAPI.getMyRequests().catch(() => ({ data: { data: [] } })),
      ]);
      setAvailableIds(availableRes.data.data || []);
      setMyRequests(requestsRes.data.data || []);
    } catch (error) {
      console.error("Failed to fetch sender IDs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (id: string) => {
    setPurchasing(id);
    try {
      await senderIdAPI.purchase(id);
      toast.success("Sender ID purchased successfully!");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to purchase Sender ID");
    } finally {
      setPurchasing(null);
    }
  };

  const handleRequestSubmit = async () => {
    if (!requestForm.senderId.trim()) {
      toast.error("Please enter a Sender ID");
      return;
    }
    if (requestForm.senderId.length < 3 || requestForm.senderId.length > 11) {
      toast.error("Sender ID must be 3-11 characters");
      return;
    }
    if (!requestForm.reason.trim()) {
      toast.error("Please provide a reason for your request");
      return;
    }

    setSubmitting(true);
    try {
      await senderIdAPI.requestCustom(requestForm);
      toast.success("Sender ID request submitted successfully!");
      setRequestDialogOpen(false);
      setRequestForm({ senderId: "", reason: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredIds = filterCategory === "all"
    ? availableIds
    : availableIds.filter((id) => id.category === filterCategory);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sender IDs"
        description="Purchase pre-registered Sender IDs or request a custom one for your brand"
      />

      {/* Current Sender ID */}
      {user?.senderId && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Send className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Active Sender ID</p>
              <p className="text-lg font-bold text-foreground">{user.senderId}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="marketplace" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="marketplace">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="requests">
            <Clock className="mr-2 h-4 w-4" />
            My Requests
          </TabsTrigger>
        </TabsList>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="generic">Generic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Request Custom ID
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Custom Sender ID</DialogTitle>
                  <DialogDescription>
                    Submit a request for a custom Sender ID. Our team will review and register it with the SMS provider.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="senderId">Sender ID (3-11 characters)</Label>
                    <Input
                      id="senderId"
                      placeholder="e.g., MYBRAND"
                      maxLength={11}
                      value={requestForm.senderId}
                      onChange={(e) =>
                        setRequestForm((f) => ({
                          ...f,
                          senderId: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Only uppercase letters and numbers allowed. {requestForm.senderId.length}/11 characters
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Request</Label>
                    <Textarea
                      id="reason"
                      placeholder="Explain how you plan to use this Sender ID and your business name..."
                      rows={4}
                      value={requestForm.reason}
                      onChange={(e) => setRequestForm((f) => ({ ...f, reason: e.target.value }))}
                    />
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium mb-1">Please Note:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Custom Sender IDs require admin approval</li>
                          <li>Registration with the SMS provider takes 24-48 hours</li>
                          <li>A registration fee of KSh 5,000 applies</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRequestSubmit} disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredIds.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Fingerprint className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No Sender IDs Available</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  All pre-registered Sender IDs have been purchased. You can request a custom one.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredIds.map((sid) => {
                const CategoryIcon = categoryIcons[sid.category];
                return (
                  <Card key={sid._id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      sid.category === "generic" ? "bg-emerald-500" :
                      sid.category === "premium" ? "bg-amber-500" : "bg-purple-500"
                    }`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold tracking-wider">
                          {sid.senderId}
                        </CardTitle>
                        <Badge variant="outline" className={categoryColors[sid.category]}>
                          <CategoryIcon className="mr-1 h-3 w-3" />
                          {sid.category}
                        </Badge>
                      </div>
                      <CardDescription>{sid.name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {sid.description && (
                        <p className="text-sm text-muted-foreground">{sid.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-foreground">
                            KSh {sid.price.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">per year</p>
                        </div>
                        <Button
                          onClick={() => handlePurchase(sid._id)}
                          disabled={purchasing === sid._id || !sid.isRegistered}
                          size="sm"
                        >
                          {purchasing === sid._id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ShoppingCart className="mr-2 h-4 w-4" />
                          )}
                          {sid.isRegistered ? "Purchase" : "Unavailable"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* My Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : myRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No Requests Yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You haven't submitted any custom Sender ID requests.
                </p>
                <Button className="mt-4" onClick={() => setRequestDialogOpen(true)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Request Custom ID
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => {
                const StatusIcon = statusConfig[req.status].icon;
                return (
                  <Card key={req._id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Fingerprint className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-bold text-lg tracking-wider text-foreground">
                            {req.requestedSenderId}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Submitted {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                          {req.adminNotes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              Admin: {req.adminNotes}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className={statusConfig[req.status].color}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusConfig[req.status].label}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
