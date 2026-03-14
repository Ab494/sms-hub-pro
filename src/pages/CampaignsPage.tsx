import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Megaphone } from "lucide-react";

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
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Megaphone className="h-8 w-8" />
                  <p className="text-sm">No campaigns yet. Create your first campaign to get started.</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
