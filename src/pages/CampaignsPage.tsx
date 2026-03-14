import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

const campaigns = [
  { id: 1, name: "Spring Sale 2026", message: "Don't miss our spring sale! Up to 50% off...", recipients: 2450, status: "Completed", date: "2026-03-10" },
  { id: 2, name: "Product Launch", message: "Introducing our brand new product line...", recipients: 1820, status: "Completed", date: "2026-03-08" },
  { id: 3, name: "Weekly Newsletter", message: "This week's top stories and updates...", recipients: 3200, status: "Scheduled", date: "2026-03-15" },
  { id: 4, name: "Feedback Request", message: "We'd love your feedback on our service...", recipients: 980, status: "Draft", date: "—" },
  { id: 5, name: "Holiday Promo", message: "Happy holidays! Enjoy a special 20% discount...", recipients: 4100, status: "Completed", date: "2026-02-28" },
];

const statusVariant = (s: string) => {
  if (s === "Completed") return "default" as const;
  if (s === "Scheduled") return "secondary" as const;
  return "outline" as const;
};

export default function CampaignsPage() {
  return (
    <div>
      <PageHeader
        title="SMS Campaigns"
        description="Manage your SMS campaigns"
        actions={<Button className="gap-2"><Plus className="h-4 w-4" /> New Campaign</Button>}
      />

      <div className="rounded-xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead className="hidden md:table-cell">Message</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground text-sm">{c.message}</TableCell>
                <TableCell>{c.recipients.toLocaleString()}</TableCell>
                <TableCell><Badge variant={statusVariant(c.status)}>{c.status}</Badge></TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{c.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
