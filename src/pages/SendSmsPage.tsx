import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, MessageSquare } from "lucide-react";
import { smsAPI, groupsAPI, contactsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface Group {
  _id: string;
  name: string;
  contactCount: number;
}

const MAX_CHARS = 160;

export default function SendSmsPage() {
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [sendingMode, setSendingMode] = useState<"single" | "bulk">("single");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await groupsAPI.getAll();
      setGroups(res.data.data.groups);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  const charCount = message.length;
  const smsCount = Math.ceil(charCount / MAX_CHARS) || 1;

  const handleSendSingle = async () => {
    if (!phone || !message) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter phone number and message"
      });
      return;
    }

    setLoading(true);
    try {
      const res = await smsAPI.send({ phone, message });
      toast({
        title: "Success",
        description: res.data.message || "SMS queued for delivery"
      });
      setPhone("");
      setMessage("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to send SMS"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendBulk = async () => {
    if (!message || (!selectedGroup && !phone)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a group or enter phone numbers"
      });
      return;
    }

    setLoading(true);
    try {
      // If phone numbers are provided, split them
      let phones: string[] = [];
      if (phone) {
        phones = phone.split(/[\n,]/).map(p => p.trim()).filter(Boolean);
      }

      const res = await smsAPI.sendBulk({
        message,
        groupId: selectedGroup || undefined,
        phones: phones.length > 0 ? phones : undefined,
        name: `Bulk SMS - ${phones.length || 'Group'} recipients`
      });
      
      toast({
        title: "Success",
        description: res.data.message || "SMS campaign queued"
      });
      setPhone("");
      setMessage("");
      setSelectedGroup("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to send bulk SMS"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Send SMS" description="Compose and send a new SMS message" />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-5">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
            {/* Send Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={sendingMode === "single" ? "default" : "outline"}
                size="sm"
                onClick={() => setSendingMode("single")}
              >
                Single SMS
              </Button>
              <Button
                variant={sendingMode === "bulk" ? "default" : "outline"}
                size="sm"
                onClick={() => setSendingMode("bulk")}
              >
                Bulk SMS
              </Button>
            </div>

            {/* Phone Input */}
            <div className="space-y-2">
              <Label>
                {sendingMode === "single" ? "Phone Number" : "Phone Numbers (one per line)"}
              </Label>
              <Input 
                placeholder={sendingMode === "single" ? "+254 7XX XXX XXX" : "254700000000\n254700000001\n254700000002"} 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                className={sendingMode === "bulk" ? "min-h-[100px]" : ""}
              />
              {sendingMode === "bulk" && (
                <p className="text-xs text-muted-foreground">
                  Enter phone numbers, one per line, or select a group below
                </p>
              )}
            </div>

            {/* Group Selection (Bulk only) */}
            {sendingMode === "bulk" && (
              <div className="space-y-2">
                <Label>Contact Group</Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No group - use phone numbers above</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group._id} value={group._id}>
                        {group.name} ({group.contactCount} contacts)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Message Input */}
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

            <Button 
              className="w-full sm:w-auto gap-2" 
              onClick={sendingMode === "single" ? handleSendSingle : handleSendBulk}
              disabled={loading || !message || (!phone && !selectedGroup)}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </div>

        {/* SMS Preview */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> SMS Preview
            </h3>
            <div className="rounded-lg bg-secondary p-4 min-h-[120px]">
              <p className="text-xs text-muted-foreground mb-1">
                {sendingMode === "single" 
                  ? `To: ${phone || "—"}` 
                  : selectedGroup 
                    ? `To: Group (${groups.find(g => g._id === selectedGroup)?.name})`
                    : `To: ${phone.split(/[\n,]/).filter(Boolean).length || 0} numbers`
                }
              </p>
              <p className="text-sm whitespace-pre-wrap">{message || "Your message will appear here..."}</p>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              <p>Estimated cost: {smsCount * (sendingMode === "single" ? 1 : (phone.split(/[\n,]/).filter(Boolean).length || 1))} units</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
