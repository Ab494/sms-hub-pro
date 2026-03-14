import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Configure your SMS platform" />

      <div className="space-y-6 max-w-2xl">
        {/* Sender ID */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <h3 className="text-sm font-semibold">Sender ID</h3>
          <div className="space-y-2">
            <Label>Sender Name</Label>
            <Input defaultValue="BulkSMS" />
            <p className="text-xs text-muted-foreground">This name will appear as the sender on recipient devices.</p>
          </div>
        </div>

        {/* API Config */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <h3 className="text-sm font-semibold">SMS API Configuration</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input type="password" defaultValue="sk_live_xxxxxxxxxxxxx" />
            </div>
            <div className="space-y-2">
              <Label>API Secret</Label>
              <Input type="password" defaultValue="xxxxxxxxxxxxx" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input defaultValue="https://yourdomain.com/webhook/sms" />
          </div>
        </div>

        {/* Profile */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <h3 className="text-sm font-semibold">Profile Settings</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input defaultValue="Admin User" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue="admin@bulksms.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Company</Label>
            <Input defaultValue="BulkSMS Inc." />
          </div>
        </div>

        <Button className="gap-2">
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </div>
    </div>
  );
}
