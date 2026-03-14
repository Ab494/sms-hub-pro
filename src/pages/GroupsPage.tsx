import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen } from "lucide-react";

export default function GroupsPage() {
  return (
    <div>
      <PageHeader
        title="Contact Groups"
        description="Organize contacts into groups"
        actions={<Button className="gap-2"><Plus className="h-4 w-4" /> Create Group</Button>}
      />

      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 shadow-card text-muted-foreground">
        <FolderOpen className="h-12 w-12 mb-3" />
        <p className="text-sm">No groups yet. Create your first group to organize contacts.</p>
      </div>
    </div>
  );
}
