import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, MessageSquare } from "lucide-react";

const MAX_CHARS = 160;

export default function SendSmsPage() {
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");

  const charCount = message.length;
  const smsCount = Math.ceil(charCount / MAX_CHARS) || 1;

  return (
    <div>
      <PageHeader title="Send SMS" description="Compose and send a new SMS message" />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-5">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input placeholder="+1 234 567 8900" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Contact Group</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select a group" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contacts</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="vip">VIP Clients</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message here..."
                rows={5}
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{charCount} / {MAX_CHARS} characters</span>
                <span>{smsCount} SMS</span>
              </div>
            </div>

            <Button className="w-full sm:w-auto gap-2">
              <Send className="h-4 w-4" /> Send Message
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> SMS Preview
            </h3>
            <div className="rounded-lg bg-secondary p-4 min-h-[120px]">
              <p className="text-xs text-muted-foreground mb-1">To: {phone || "—"}</p>
              <p className="text-sm whitespace-pre-wrap">{message || "Your message will appear here..."}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
