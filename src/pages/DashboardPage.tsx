import { Send, CheckCircle, XCircle, Users, Wallet } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { PageHeader } from "@/components/PageHeader";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your SMS activity" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
        <StatsCard title="Total SMS Sent" value="0" change="No data yet" changeType="neutral" icon={Send} />
        <StatsCard title="SMS Delivered" value="0" change="No data yet" changeType="neutral" icon={CheckCircle} />
        <StatsCard title="Failed SMS" value="0" change="No data yet" changeType="neutral" icon={XCircle} iconColor="bg-destructive/10" />
        <StatsCard title="Contacts" value="0" change="No data yet" changeType="neutral" icon={Users} />
        <StatsCard title="SMS Balance" value="0" change="No data yet" changeType="neutral" icon={Wallet} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold mb-4">SMS Activity</h3>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            No activity data available yet
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold mb-4">Delivery Rate</h3>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            No delivery data available yet
          </div>
        </div>
      </div>
    </div>
  );
}
