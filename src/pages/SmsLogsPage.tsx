import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText } from "lucide-react";
import { smsAPI } from "@/lib/api";

interface SMSLog {
  _id: string;
  phone: string;
  message: string;
  status: string;
  senderId?: string;
  cost: number;
  createdAt: string;
}

export default function SmsLogsPage() {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });

  useEffect(() => {
    fetchLogs();
  }, [pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await smsAPI.getLogs({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined
      });
      setLogs(res.data.data.logs);
      setPagination(prev => ({ ...prev, ...res.data.data.pagination }));
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      queued: "bg-blue-100 text-blue-800",
      sent: "bg-blue-100 text-blue-800",
      delivered: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800"
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="SMS Logs" description="View all sent and received messages" />

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 border-b border-border">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by phone..." 
              className="pl-9" 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone</TableHead>
              <TableHead className="hidden md:table-cell">Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileText className="h-8 w-8" />
                    <p className="text-sm">No SMS logs yet. Logs will appear here after sending messages.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell className="font-medium">{log.phone}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs truncate">
                    {log.message}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(log.status)}`}>
                      {log.status}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-border flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
