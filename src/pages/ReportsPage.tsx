import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BarChart3, TrendingUp, DollarSign } from "lucide-react";
import { smsAPI } from "@/lib/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

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

  const barChartData = stats ? [
    { name: 'Delivered', value: stats.totalDelivered },
    { name: 'Failed', value: stats.totalFailed },
    { name: 'Today', value: stats.todaySent },
  ] : [];

  const pieChartData = stats ? [
    { name: 'Delivered', value: stats.totalDelivered, color: '#10B981' },
    { name: 'Failed', value: stats.totalFailed, color: '#EF4444' },
    { name: 'Other', value: Math.max(0, stats.totalSent - stats.totalDelivered - stats.totalFailed), color: '#F59E0B' },
  ].filter(item => item.value > 0) : [];

  const totalSMS = stats ? stats.totalSent : 0;

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
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
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Total Cost</p>
          <p className="text-2xl font-semibold text-orange-600">KES {stats?.totalCost?.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold mb-4">SMS Consumption Breakdown</h3>
          {totalSMS > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} SMS (${((value / totalSMS) * 100).toFixed(1)}%)`,
                    name
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No SMS data available yet</p>
                <p className="text-xs mt-1">Send some messages to see the breakdown</p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold mb-4">SMS Performance Trends</h3>
          {stats && stats.totalSent > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} SMS`,
                    name
                  ]}
                />
                <Bar dataKey="value" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No performance data yet</p>
                <p className="text-xs mt-1">Send messages to track performance</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Campaign Overview
          </h3>
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            {stats?.campaignsCount && stats.campaignsCount > 0 ? (
              <div className="text-center">
                <div className="text-4xl font-bold">{stats.campaignsCount}</div>
                <p>Total campaigns created</p>
                <p className="text-xs mt-2">Avg. {stats.totalSent > 0 ? Math.round(stats.totalSent / stats.campaignsCount) : 0} SMS per campaign</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <BarChart3 className="h-8 w-8" />
                <p>Create your first campaign to see statistics</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cost Analysis
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Cost</span>
              <span className="font-semibold">KES {stats?.totalCost?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg. Cost per SMS</span>
              <span className="font-semibold">
                KES {stats?.totalSent && stats.totalSent > 0 ? (stats.totalCost / stats.totalSent).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Today's Cost</span>
              <span className="font-semibold text-blue-600">
                KES {stats?.todaySent ? (stats.todaySent * 0.46).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Monthly Projection</span>
                <span className="font-semibold text-green-600">
                  KES {stats?.totalSent && stats.totalSent > 0 ? ((stats.totalCost / stats.totalSent) * 1000).toFixed(0) : '0'}/month
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
