import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface Transaction {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    company: string;
  };
  type: string;
  amount: number;
  cost: number;
  price: number;
  description: string;
  status: string;
  createdAt: string;
}

interface Totals {
  totalCreditsPurchased: number;
  totalCreditsUsed: number;
  totalRevenue: number;
  totalCost: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminTransactionsPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState<Totals>({ totalCreditsPurchased: 0, totalCreditsUsed: 0, totalRevenue: 0, totalCost: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchTransactions();
  }, [page, typeFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTransactions({ 
        page, 
        limit: 20,
        type: typeFilter || undefined,
      });
      setTransactions(response.data.data.transactions);
      setTotals(response.data.data.totals);
      setPagination(response.data.data.pagination);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to fetch transactions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge className="bg-green-100 text-green-800">Purchase</Badge>;
      case 'usage':
        return <Badge className="bg-red-100 text-red-800">Usage</Badge>;
      case 'adjustment':
        return <Badge className="bg-blue-100 text-blue-800">Adjustment</Badge>;
      case 'bonus':
        return <Badge className="bg-purple-100 text-purple-800">Bonus</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">View all credit transactions across the platform</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Purchased</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalCreditsPurchased.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">credits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalCreditsUsed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">credits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">KES {totals.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KES {(totals.totalRevenue - totals.totalCost).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              className="px-3 py-2 border rounded-md"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Types</option>
              <option value="purchase">Purchase</option>
              <option value="usage">Usage</option>
              <option value="adjustment">Adjustment</option>
              <option value="bonus">Bonus</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx._id}>
                      <TableCell className="text-sm">
                        {new Date(tx.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {tx.userId?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{tx.userId?.company || '-'}</TableCell>
                      <TableCell>{getTypeBadge(tx.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {tx.type === 'purchase' ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          )}
                          <span className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>KES {tx.price?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>KES {tx.cost?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {tx.description || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {transactions.length} of {pagination.total} transactions
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}