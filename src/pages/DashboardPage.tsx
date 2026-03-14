import { Send, CheckCircle, XCircle, Users, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { PageHeader } from "@/components/PageHeader";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const activityData = [
  { date: "Mon", sent: 420, delivered: 390, failed: 30 },
  { date: "Tue", sent: 680, delivered: 650, failed: 30 },
  { date: "Wed", sent: 520, delivered: 500, failed: 20 },
  { date: "Thu", sent: 890, delivered: 860, failed: 30 },
  { date: "Fri", sent: 750, delivered: 720, failed: 30 },
  { date: "Sat", sent: 340, delivered: 330, failed: 10 },
  { date: "Sun", sent: 280, delivered: 270, failed: 10 },
];

const deliveryData = [
  { name: "Delivered", value: 3720, color: "hsl(142, 71%, 45%)" },
  { name: "Failed", value: 160, color: "hsl(0, 72%, 51%)" },
  { name: "Pending", value: 80, color: "hsl(38, 92%, 50%)" },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your SMS activity" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
        <StatsCard title="Total SMS Sent" value="12,847" change="+12.5% from last month" changeType="positive" icon={Send} />
        <StatsCard title="SMS Delivered" value="12,340" change="96.1% delivery rate" changeType="positive" icon={CheckCircle} />
        <StatsCard title="Failed SMS" value="507" change="-3.2% from last month" changeType="negative" icon={XCircle} iconColor="bg-destructive/10" />
        <StatsCard title="Contacts" value="2,456" change="+89 new this month" changeType="positive" icon={Users} />
        <StatsCard title="SMS Balance" value="45,230" change="Credits remaining" changeType="neutral" icon={Wallet} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold mb-4">SMS Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="sent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="delivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(215, 14%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 14%, 50%)" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(215,20%,91%)", fontSize: 13 }} />
              <Area type="monotone" dataKey="sent" stroke="hsl(221, 83%, 53%)" fill="url(#sent)" strokeWidth={2} />
              <Area type="monotone" dataKey="delivered" stroke="hsl(142, 71%, 45%)" fill="url(#delivered)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold mb-4">Delivery Rate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={deliveryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                {deliveryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
