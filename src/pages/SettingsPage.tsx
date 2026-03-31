import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    senderId: ""
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        company: user.company || "",
        senderId: user.senderId || ""
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await authAPI.updateProfile({
        name: formData.name,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        senderId: formData.senderId || undefined
      });
      updateUser(res.data.data.user);
      toast({
        title: "Success",
        description: "Settings saved successfully"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to save settings"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Configure your SMS platform" />

      <div className="space-y-6 max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <h3 className="text-sm font-semibold">Profile Settings</h3>
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your name" 
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input 
              value={formData.email}
              disabled
              placeholder="Enter your email" 
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input 
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="254700000000" 
            />
          </div>
          <div className="space-y-2">
            <Label>Company</Label>
            <Input 
              value={formData.company}
              onChange={e => setFormData({ ...formData, company: e.target.value })}
              placeholder="Enter company name" 
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <h3 className="text-sm font-semibold">Sender ID</h3>
          <div className="space-y-2">
            <Label>Sender Name</Label>
            <Input 
              value={formData.senderId}
              onChange={e => setFormData({ ...formData, senderId: e.target.value })}
              placeholder="Enter sender name" 
            />
            <p className="text-xs text-muted-foreground">
              This name will appear as the sender on recipient devices. Maximum 11 characters.
            </p>
          </div>
        </div>

        <Button className="gap-2" onClick={handleSave} disabled={loading}>
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
