import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Banknote
} from "lucide-react";
import { adminAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Withdrawal {
  _id: string;
  requestedBy: {
    name: string;
    email: string;
  };
  amount: number;
  method: string;
  recipientDetails: {
    phone?: string;
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
  };
  status: string;
  reference?: string;
  notes?: string;
  createdAt: string;
  processedAt?: string;
}

interface WithdrawalStats {
  totalProfit: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  processingWithdrawals: number;
  availableForWithdrawal: number;
  withdrawalStats: Array<{
    _id: string;
    count: number;
    total: number;
  }>;
}

export default function WithdrawalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  // Request withdrawal form
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    method: 'mpesa' as 'mpesa' | 'bank_transfer',
    phone: '',
    accountName: '',
    accountNumber: '',
    bankName: ''
  });

  // Process withdrawal
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [processForm, setProcessForm] = useState({
    action: 'complete' as 'complete' | 'fail' | 'cancel',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [withdrawalsRes, statsRes] = await Promise.all([
        adminAPI.getWithdrawals({ limit: 50 }),
        adminAPI.getWithdrawalStats()
      ]);

      setWithdrawals(withdrawalsRes.data.data.withdrawals);
      setStats(statsRes.data.data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to load withdrawal data"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestWithdrawal = async () => {
    if (!withdrawalForm.amount || parseFloat(withdrawalForm.amount) < 100) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Minimum withdrawal amount is KES 100"
      });
      return;
    }

    if (withdrawalForm.method === 'mpesa' && !withdrawalForm.phone) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "M-Pesa phone number is required"
      });
      return;
    }

    if (withdrawalForm.method === 'bank_transfer' && (!withdrawalForm.accountName || !withdrawalForm.accountNumber || !withdrawalForm.bankName)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "All bank details are required"
      });
      return;
    }

    setRequesting(true);
    try {
      await adminAPI.requestWithdrawal({
        amount: parseFloat(withdrawalForm.amount),
        method: withdrawalForm.method,
        recipientDetails: {
          phone: withdrawalForm.phone || undefined,
          accountName: withdrawalForm.accountName || undefined,
          accountNumber: withdrawalForm.accountNumber || undefined,
          bankName: withdrawalForm.bankName || undefined,
        }
      });

      toast({
        title: "Success",
        description: "Withdrawal request submitted successfully"
      });

      setShowRequestDialog(false);
      setWithdrawalForm({
        amount: '',
        method: 'mpesa',
        phone: '',
        accountName: '',
        accountNumber: '',
        bankName: ''
      });

      fetchData(); // Refresh data
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to request withdrawal"
      });
    } finally {
      setRequesting(false);
    }
  };

  const handleProcessWithdrawal = async (withdrawalId: string) => {
    try {
      await adminAPI.processWithdrawal(withdrawalId, processForm);

      toast({
        title: "Success",
        description: `Withdrawal ${processForm.action}d successfully`
      });

      setShowProcessDialog(false);
      setProcessingId(null);
      setProcessForm({ action: 'complete', notes: '' });

      fetchData(); // Refresh data
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to process withdrawal"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Processing</Badge>;
      case 'cancelled':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Withdrawals" description="Manage fund withdrawals" />

        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Request Withdrawal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Profit Withdrawal</DialogTitle>
              <DialogDescription>
                Available for withdrawal: KES {stats?.availableForWithdrawal?.toLocaleString() || 0}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="100"
                  min="100"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="method">Payment Method</Label>
                <Select
                  value={withdrawalForm.method}
                  onValueChange={(value: 'mpesa' | 'bank_transfer') =>
                    setWithdrawalForm(prev => ({ ...prev, method: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {withdrawalForm.method === 'mpesa' ? (
                <div>
                  <Label htmlFor="phone">M-Pesa Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+254 7XX XXX XXX"
                    value={withdrawalForm.phone}
                    onChange={(e) => setWithdrawalForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      placeholder="John Doe"
                      value={withdrawalForm.accountName}
                      onChange={(e) => setWithdrawalForm(prev => ({ ...prev, accountName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      placeholder="1234567890"
                      value={withdrawalForm.accountNumber}
                      onChange={(e) => setWithdrawalForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      placeholder="Equity Bank"
                      value={withdrawalForm.bankName}
                      onChange={(e) => setWithdrawalForm(prev => ({ ...prev, bankName: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleRequestWithdrawal}
                disabled={requesting}
                className="w-full"
              >
                {requesting ? "Requesting..." : "Request Withdrawal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KES {stats?.totalProfit?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Total Withdrawn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              KES {stats?.totalWithdrawn?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              KES {stats?.pendingWithdrawals?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KES {stats?.availableForWithdrawal?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
          <CardDescription>Manage all withdrawal requests</CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No withdrawal requests yet</p>
              <p className="text-sm">Click "Request Withdrawal" to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal._id}>
                    <TableCell>
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-semibold">
                      KES {withdrawal.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="capitalize">{withdrawal.method.replace('_', ' ')}</TableCell>
                    <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                    <TableCell>
                      {withdrawal.method === 'mpesa'
                        ? withdrawal.recipientDetails.phone
                        : `${withdrawal.recipientDetails.accountName} - ${withdrawal.recipientDetails.bankName}`
                      }
                    </TableCell>
                    <TableCell>
                      {withdrawal.status === 'pending' && (
                        <Dialog open={processingId === withdrawal._id} onOpenChange={(open) => {
                          setProcessingId(open ? withdrawal._id : null);
                          setShowProcessDialog(open);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Process
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Process Withdrawal</DialogTitle>
                              <DialogDescription>
                                Process withdrawal request for KES {withdrawal.amount.toLocaleString()}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              <Select
                                value={processForm.action}
                                onValueChange={(value: 'complete' | 'fail' | 'cancel') =>
                                  setProcessForm(prev => ({ ...prev, action: value }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="complete">Mark as Completed</SelectItem>
                                  <SelectItem value="fail">Mark as Failed</SelectItem>
                                  <SelectItem value="cancel">Cancel Request</SelectItem>
                                </SelectContent>
                              </Select>

                              <Textarea
                                placeholder="Add notes (optional)"
                                value={processForm.notes}
                                onChange={(e) => setProcessForm(prev => ({ ...prev, notes: e.target.value }))}
                              />

                              <Button
                                onClick={() => handleProcessWithdrawal(withdrawal._id)}
                                className="w-full"
                              >
                                Process Withdrawal
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}