import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Users, FolderOpen } from "lucide-react";

const groups = [
  { id: 1, name: "Customers", contacts: 845, description: "Active paying customers" },
  { id: 2, name: "VIP Clients", contacts: 124, description: "High-value clients" },
  { id: 3, name: "Leads", contacts: 1487, description: "Potential customers from campaigns" },
  { id: 4, name: "Staff", contacts: 56, description: "Internal team members" },
  { id: 5, name: "Partners", contacts: 32, description: "Business partners" },
];

export default function GroupsPage() {
  return (
    <div>
      <PageHeader
        title="Contact Groups"
        description="Organize contacts into groups"
        actions={<Button className="gap-2"><Plus className="h-4 w-4" /> Create Group</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(g => (
          <div key={g.id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{g.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{g.contacts} contacts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
