import { PageHeader } from "@/components/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

const logs = [
  { id: 1, phone: "+1 234 567 8901", message: "Your order #1234 has been shipped.", status: "Delivered", time: "2026-03-14 09:23" },
  { id: 2, phone: "+1 234 567 8902", message: "Don't miss our spring sale!", status: "Delivered", time: "2026-03-14 09:20" },
  { id: 3, phone: "+1 234 567 8903", message: "Your OTP is 482910", status: "Sent", time: "2026-03-14 09:18" },
  { id: 4, phone: "+1 234 567 8904", message: "Payment received. Thank you!", status: "Failed", time: "2026-03-14 09:15" },
  { id: 5, phone: "+1 234 567 8905", message: "Your appointment is tomorrow at 3 PM", status: "Delivered", time: "2026-03-14 09:10" },
  { id: 6, phone: "+1 234 567 8906", message: "Welcome to BulkSMS platform!", status: "Delivered", time: "2026-03-14 09:05" },
  { id: 7, phone: "+1 234 567 8907", message: "Your subscription will expire soon", status: "Sent", time: "2026-03-14 09:00" },
  { id: 8, phone: "+1 234 567 8908", message: "Flash sale starts now!", status: "Failed", time: "2026-03-14 08:55" },
];

const statusColor = (s: string) => {
  if (s === "Delivered") return "default" as const;
  if (s === "Sent") return "secondary" as const;
  return "destructive" as const;
};

export default function SmsLogsPage() {
  const [search, setSearch] = useState("");
  const filtered = logs.filter(l =>
    l.phone.includes(search) || l.message.toLowerCase().includes(search.toLowerCase())
  );

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
            {filtered.map(l => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.phone}</TableCell>
                <TableCell className="hidden md:table-cell max-w-[250px] truncate text-muted-foreground text-sm">{l.message}</TableCell>
                <TableCell><Badge variant={statusColor(l.status)}>{l.status}</Badge></TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{l.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
