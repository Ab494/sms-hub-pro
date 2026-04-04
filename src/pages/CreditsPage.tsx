import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  CreditCard,
  DollarSign,
  Smartphone,
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus
} from "lucide-react";
import { creditsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Pricing {
  sms_price_per_unit: number;
  sms_cost_per_unit: number;
  minimum_credit_purchase: number;
  bonus_credits_percent: number;
  currency: string;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  cost: number;
  price: number;
  description: string;
  status: string;
  createdAt: string;
}

interface CreditData {
  balance: number;
  transactions: Transaction[];
  pricing: Pricing;
}

const CREDIT_PACKAGES = [
  { credits: 100, bonus: 0, popular: false },
  { credits: 250, bonus: 25, popular: true },
  { credits: 500, bonus: 75, popular: false },
  { credits: 1000, bonus: 200, popular: false },
  { credits: 2500, bonus: 625, popular: false },
];

export default function CreditsPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");

  useEffect(() => {
    fetchCreditData();
  }, []);

  const fetchCreditData = async () => {
    try {
      setLoading(true);
      const response = await creditsAPI.getCredits();
      setCreditData(response.data.data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to load credit data"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (credits: number, phone?: string) => {
    if (!phone && !phoneNumber) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your M-Pesa phone number"
      });
      return;
    }

    setPurchasing(true);
    try {
      const response = await creditsAPI.purchaseCredits({
        amount: credits,
        paymentMethod: 'mpesa',
        phone: phone || phoneNumber
      });

      toast({
        title: "Payment Initiated",
        description: "Please check your phone and enter your M-Pesa PIN to complete the purchase"
      });

      // Start polling for payment status
      pollPaymentStatus(response.data.data.checkoutRequestId);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to initiate purchase"
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handleCustomPurchase = () => {
    const amount = parseInt(customAmount);
    if (!amount || amount < (creditData?.pricing.minimum_credit_purchase || 100)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Minimum purchase is ${creditData?.pricing.minimum_credit_purchase || 100} credits`
      });
      return;
    }
    handlePurchase(amount);
  };

  const pollPaymentStatus = async (checkoutRequestId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await creditsAPI.verifyPayment(checkoutRequestId);
        if (response.data.data.status === 'completed') {
          clearInterval(pollInterval);
          toast({
            title: "Payment Successful",
            description: "Credits have been added to your account"
          });
          // Update user balance
          if (creditData) {
            updateUser({ smsBalance: creditData.balance + response.data.data.balance });
          }
          fetchCreditData(); // Refresh data
        } else if (response.data.data.status === 'failed') {
          clearInterval(pollInterval);
          toast({
            variant: "destructive",
            title: "Payment Failed",
            description: "Please try again or contact support"
          });
        }
      } catch (error) {
        // Continue polling
      }
    }, 5000); // Check every 5 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  };

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'pending') return <Clock className="h-4 w-4 text-yellow-500" />;
    if (status === 'failed') return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (type === 'purchase') return <Plus className="h-4 w-4 text-green-500" />;
    return <CreditCard className="h-4 w-4 text-blue-500" />;
  };

  const getTransactionBadge = (type: string, status: string) => {
    if (status === 'pending') return <Badge variant="outline" className="text-yellow-600">Pending</Badge>;
    if (status === 'failed') return <Badge variant="destructive">Failed</Badge>;
    if (type === 'purchase') return <Badge className="bg-green-100 text-green-800">Purchase</Badge>;
    return <Badge variant="secondary">Usage</Badge>;
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
      <PageHeader title="Credits & Billing" description="Manage your SMS credits and billing" />

      {/* Current Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Balance
          </CardTitle>
          <CardDescription>Your available SMS credits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {creditData?.balance || 0} Credits
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            ≈ KES {((creditData?.balance || 0) * (creditData?.pricing.sms_price_per_unit || 0.5)).toFixed(2)} worth of SMS
          </p>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Purchase Credits</h2>

        {/* Phone Number Input */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+254 7XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This number will receive the M-Pesa payment prompt
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Predefined Packages */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CREDIT_PACKAGES.map((pkg) => {
            const totalCredits = pkg.credits + pkg.bonus;
            const cost = pkg.credits * (creditData?.pricing.sms_price_per_unit || 0.5);

            return (
              <Card key={pkg.credits} className={`relative ${pkg.popular ? 'border-primary' : ''}`}>
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-4 bg-primary">Most Popular</Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{pkg.credits} Credits</span>
                    {pkg.bonus > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        +{pkg.bonus} Bonus
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {pkg.bonus > 0 && `${totalCredits} credits total • `}
                    KES {cost.toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => handlePurchase(pkg.credits)}
                    disabled={purchasing}
                  >
                    {purchasing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Smartphone className="h-4 w-4 mr-2" />
                    )}
                    Buy Now
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Custom Amount */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Amount</CardTitle>
            <CardDescription>Purchase any number of credits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="custom-amount">Number of Credits</Label>
                <Input
                  id="custom-amount"
                  type="number"
                  placeholder="100"
                  min={creditData?.pricing.minimum_credit_purchase || 100}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleCustomPurchase} disabled={purchasing || !customAmount}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Purchase
                </Button>
              </div>
            </div>
            {customAmount && (
              <p className="text-sm text-muted-foreground">
                Cost: KES {(parseInt(customAmount) * (creditData?.pricing.sms_price_per_unit || 0.5)).toFixed(2)}
                {parseInt(customAmount) >= 250 && ` + ${Math.floor(parseInt(customAmount) * (creditData?.pricing.bonus_credits_percent || 0) / 100)} bonus credits`}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>Your recent credit transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {creditData?.transactions && creditData.transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditData.transactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell className="text-sm">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.type, transaction.status)}
                        <span className="capitalize">{transaction.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getTransactionBadge(transaction.type, transaction.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {transaction.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Your credit purchase history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}