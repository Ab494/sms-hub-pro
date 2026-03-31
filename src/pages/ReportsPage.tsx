import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BarChart3 } from "lucide-react";
import { smsAPI } from "@/lib/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface Stats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalCost: number;
  deliveryRate: number;
  todaySent: number;
  campaignsCount: number;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await smsAPI.getStats();
      setStats(res.data.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = stats ? [
    { name: 'Delivered', value: stats.totalDelivered },
    { name: 'Failed', value: stats.totalFailed },
    { name: 'Today', value: stats.todaySent },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Reports" description="Analyze your SMS performance" />

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Total Sent</p>
          <p className="text-2xl font-semibold">{stats?.totalSent || 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Delivered</p>
          <p className="text-2xl font-semibold text-green-600">{stats?.totalDelivered || 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Failed</p>
          <p className="text-2xl font-semibold text-red-600">{stats?.totalFailed || 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Delivery Rate</p>
          <p className="text-2xl font-semibold text-blue-600">{stats?.deliveryRate || 0}%</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold mb-4">SMS Sent Overview</h3>
          {stats && stats.totalSent > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              No data available yet
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold mb-4">Delivery Rate (%)</h3>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{stats?.deliveryRate || 0}%</div>
              <p className="text-sm text-muted-foreground mt-2">Delivery success rate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-sm font-semibold mb-4">Campaigns</h3>
        <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
          {stats?.campaignsCount && stats.campaignsCount > 0 ? (
            <div className="text-center">
              <div className="text-4xl font-bold">{stats.campaignsCount}</div>
              <p>Total campaigns</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              <p>Reports will populate once you start sending messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
