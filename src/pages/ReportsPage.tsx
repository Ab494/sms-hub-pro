import { PageHeader } from "@/components/PageHeader";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" description="Analyze your SMS performance" />

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold mb-4">SMS Sent Per Day</h3>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            No data available yet
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold mb-4">Delivery Rate (%)</h3>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            No data available yet
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-sm font-semibold mb-4">Failed Messages</h3>
        <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
          <div className="flex flex-col items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            <p>Reports will populate once you start sending messages</p>
          </div>
        </div>
      </div>
    </div>
  );
}
