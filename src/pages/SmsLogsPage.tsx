import { PageHeader } from "@/components/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, FileText } from "lucide-react";
import { useState } from "react";

export default function SmsLogsPage() {
  const [search, setSearch] = useState("");

  return (
    <div>
      <PageHeader title="SMS Logs" description="View all sent and received messages" />

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 border-b border-border">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search logs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone</TableHead>
              <TableHead className="hidden md:table-cell">Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileText className="h-8 w-8" />
                  <p className="text-sm">No SMS logs yet. Logs will appear here after sending messages.</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
