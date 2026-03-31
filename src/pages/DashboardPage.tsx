import { useState, useEffect } from "react";
import { Send, Users, CreditCard, ArrowRight, MessageSquare, FileText, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import { smsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Stats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalCost: number;
  deliveryRate: number;
  todaySent: number;
  campaignsCount: number;
  balance: number;
}

interface RecentLog {
  _id: string;
  phone: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupPhone, setTopupPhone] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        smsAPI.getStats(),
        smsAPI.getLogs({ limit: 5 })
      ]);
      
      setStats(statsRes.data.data);
      setRecentLogs(logsRes.data.data.logs);
      
      // Update user balance in context
      if (statsRes.data.data.balance !== undefined) {
        updateUser({ smsBalance: statsRes.data.data.balance });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const GRADIENT_CARDS = [
    {
      value: stats ? `${stats.balance} units` : "— units",
      label: "SMS Balance",
      gradient: "from-[hsl(221,83%,53%)] to-[hsl(221,83%,40%)]",
      icon: CreditCard,
      cta: "Topup SMS",
      link: "/settings",
    },
    {
      value: stats ? `${stats.todaySent}` : "0",
      label: "Sent Today",
      gradient: "from-[hsl(142,71%,45%)] to-[hsl(142,71%,32%)]",
      icon: Send,
      cta: "More info",
      link: "/reports",
    },
    {
      value: stats ? `${stats.totalSent}` : "0",
      label: "Total Sent",
      gradient: "from-[hsl(262,83%,58%)] to-[hsl(262,83%,44%)]",
      icon: Users,
      cta: "View All",
      link: "/logs",
    },
    {
      value: user?.senderId || "Not Set",
      label: "Sender ID",
      gradient: "from-[hsl(0,72%,51%)] to-[hsl(0,72%,38%)]",
      icon: MessageSquare,
      cta: "Configure",
      link: "/settings",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your SMS activity" />

      {/* Gradient Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {GRADIENT_CARDS.map((card) => (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${card.gradient} p-5 text-white shadow-card`}
          >
            <div className="absolute top-3 right-3 opacity-20">
              <card.icon className="h-16 w-16" />
            </div>
            <div className="relative z-10">
              <p className="text-2xl font-bold tracking-tight">{card.value}</p>
              <p className="text-sm opacity-80 mt-1">{card.label}</p>
            </div>
            <Link
              to={card.link}
              className="relative z-10 mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white transition-colors"
            >
              {card.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>

      {/* Referral Banner */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3 mb-6 shadow-card">
        <p className="text-sm text-muted-foreground">
          Refer a business now and get <span className="font-semibold text-foreground">700 FREE SMS</span> instantly.
        </p>
        <button className="text-sm font-medium border border-border rounded-lg px-4 py-1.5 hover:bg-accent transition-colors">
          Refer a Business
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Messages */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card">
          <div className="p-5 border-b border-border">
            <h3 className="text-sm font-semibold">Recent Messages</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Message</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No messages yet
                    </td>
                  </tr>
                ) : (
                  recentLogs.map((log) => (
                    <tr key={log._id} className="border-b border-border">
                      <td className="p-3">{log.phone}</td>
                      <td className="p-3 max-w-xs truncate">{log.message}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          log.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          log.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          log.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-border text-center">
            <Link
              to="/logs"
              className="text-sm font-medium text-primary hover:underline"
            >
              View Messages History
            </Link>
          </div>
        </div>

        {/* Topup SMS Sidebar */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold">Topup SMS</h3>
            <button className="text-xs font-medium border border-border rounded-lg px-3 py-1.5 hover:bg-accent transition-colors flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Generate invoice
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-sm font-medium">
                Enter Amount <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                placeholder="Amount"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-green-600 mt-1">
                Ksh. {topupAmount || 0} @ 0.35 = {Math.floor(Number(topupAmount) / 0.35) || 0} units
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">
                Phone number to pay <span className="text-destructive">*</span>
              </label>
              <input
                type="tel"
                placeholder="254700000000"
                value={topupPhone}
                onChange={(e) => setTopupPhone(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
              Proceed
            </button>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold mb-3">Quick Stats</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Rate</span>
                  <span className="font-medium">{stats?.deliveryRate || 0}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Campaigns</span>
                  <span className="font-medium">{stats?.campaignsCount || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Sent</span>
                  <span className="font-medium">{stats?.totalSent || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SMS Consumption Report */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-sm font-semibold mb-4">SMS Delivery Status</h3>
        {stats && stats.totalSent > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Delivered', value: stats.totalDelivered },
                  { name: 'Failed', value: stats.totalFailed },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                <Cell fill="hsl(142, 71%, 45%)" />
                <Cell fill="hsl(0, 72%, 51%)" />
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
            No consumption data available yet
          </div>
        )}
      </div>
    </div>
  );
}
