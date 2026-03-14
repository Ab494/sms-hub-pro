import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Configure your SMS platform" />

      <div className="space-y-6 max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <h3 className="text-sm font-semibold">Sender ID</h3>
          <div className="space-y-2">
            <Label>Sender Name</Label>
            <Input placeholder="Enter sender name" />
            <p className="text-xs text-muted-foreground">This name will appear as the sender on recipient devices.</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <h3 className="text-sm font-semibold">SMS API Configuration</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input type="password" placeholder="Enter API key" />
            </div>
            <div className="space-y-2">
              <Label>API Secret</Label>
              <Input type="password" placeholder="Enter API secret" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input placeholder="https://yourdomain.com/webhook/sms" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <h3 className="text-sm font-semibold">Profile Settings</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input placeholder="Enter your name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input placeholder="Enter your email" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Company</Label>
            <Input placeholder="Enter company name" />
          </div>
        </div>

        <Button className="gap-2">
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </div>
    </div>
  );
}
