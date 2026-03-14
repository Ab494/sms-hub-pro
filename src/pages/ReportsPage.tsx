import { PageHeader } from "@/components/PageHeader";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

const dailyData = [
  { date: "Mar 8", sent: 320, delivered: 305, failed: 15 },
  { date: "Mar 9", sent: 450, delivered: 430, failed: 20 },
  { date: "Mar 10", sent: 680, delivered: 660, failed: 20 },
  { date: "Mar 11", sent: 520, delivered: 500, failed: 20 },
  { date: "Mar 12", sent: 890, delivered: 870, failed: 20 },
  { date: "Mar 13", sent: 750, delivered: 730, failed: 20 },
  { date: "Mar 14", sent: 610, delivered: 590, failed: 20 },
];

const rateData = [
  { date: "Mar 8", rate: 95.3 },
  { date: "Mar 9", rate: 95.6 },
  { date: "Mar 10", rate: 97.1 },
  { date: "Mar 11", rate: 96.2 },
  { date: "Mar 12", rate: 97.8 },
  { date: "Mar 13", rate: 97.3 },
  { date: "Mar 14", rate: 96.7 },
];

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" description="Analyze your SMS performance" />

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold mb-4">SMS Sent Per Day</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215,20%,91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(215,14%,50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215,14%,50%)" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="delivered" fill="hsl(221,83%,53%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" fill="hsl(0,72%,51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold mb-4">Delivery Rate (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215,20%,91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(215,14%,50%)" />
              <YAxis domain={[90, 100]} tick={{ fontSize: 12 }} stroke="hsl(215,14%,50%)" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
              <Line type="monotone" dataKey="rate" stroke="hsl(142,71%,45%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-sm font-semibold mb-4">Failed Messages</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(215,20%,91%)" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(215,14%,50%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(215,14%,50%)" />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
            <Bar dataKey="failed" fill="hsl(0,72%,51%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
