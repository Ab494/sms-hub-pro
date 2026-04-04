import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  CreditCard, 
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Building2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface PlatformStats {
  overview: {
    totalCompanies: number;
    activeCompanies: number;
    totalSMS: number;
    totalCampaigns: number;
  };
  credits: {
    totalPurchased: number;
    totalUsed: number;
    totalRevenue: number;
    totalCost: number;
    profit: number;
  };
  today: {
    sent: number;
    delivered: number;
    failed: number;
  };
  recentTransactions: Array<{
    _id: string;
    userId: { name: string; company: string };
    type: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform overview and statistics</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Activity className="w-3 h-3 mr-1" />
            System Operational
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview.totalCompanies || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats?.overview.activeCompanies || 0} active</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total SMS Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview.totalSMS?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.overview.totalCampaigns || 0} campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's SMS</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.today.sent || 0) + (stats?.today.delivered || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats?.today.delivered || 0} delivered</span>
              {' / '}
              <span className="text-red-600">{stats?.today.failed || 0} failed</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {stats?.credits.totalRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">KES {stats?.credits.profit?.toLocaleString() || 0} profit</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available for Withdrawal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KES {(stats?.credits.profit - (stats?.withdrawals?.totalWithdrawn || 0))?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">KES {(stats?.withdrawals?.totalWithdrawn || 0).toLocaleString()} withdrawn</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/admin/companies">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Companies</h3>
                  <p className="text-sm text-muted-foreground">View and manage all companies</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/transactions">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Transactions</h3>
                  <p className="text-sm text-muted-foreground">View credit transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/withdrawals">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Withdrawals</h3>
                  <p className="text-sm text-muted-foreground">Manage profit withdrawals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/settings">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Platform Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure platform settings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Transactions & Credit Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Credit Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Credits Purchased</span>
                <span className="font-semibold">{stats?.credits.totalPurchased?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Credits Used</span>
                <span className="font-semibold">{stats?.credits.totalUsed?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Revenue</span>
                <span className="font-semibold text-green-600">KES {stats?.credits.totalRevenue?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Cost</span>
                <span className="font-semibold text-red-600">KES {stats?.credits.totalCost?.toLocaleString() || 0}</span>
              </div>
              <div className="border-t pt-4 flex items-center justify-between">
                <span className="font-medium">Net Profit</span>
                <span className="font-bold text-green-600">KES {stats?.credits.profit?.toLocaleString() || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentTransactions.slice(0, 5).map((tx) => (
                  <div key={tx._id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {tx.type === 'purchase' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{tx.userId?.name || 'Unknown'}</span>
                    </div>
                    <div className="text-right">
                      <span className={tx.type === 'purchase' ? 'text-green-600' : 'text-red-600'}>
                        {tx.type === 'purchase' ? '+' : ''}{tx.amount}
                      </span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent transactions</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}