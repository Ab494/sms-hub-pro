import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Megaphone, Eye, XCircle } from "lucide-react";
import { smsAPI } from "@/lib/api";

interface Campaign {
  _id: string;
  name: string;
  message: string;
  recipientCount: number;
  status: string;
  successCount: number;
  failedCount: number;
  cost: number;
  createdAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await smsAPI.getCampaigns({ limit: 50 });
      setCampaigns(res.data.data.campaigns);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this campaign?")) return;
    
    try {
      await smsAPI.cancelCampaign(id);
      fetchCampaigns();
    } catch (error) {
      console.error("Failed to cancel campaign:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      queued: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="SMS Campaigns"
        description="Manage your SMS campaigns"
      />

      <div className="rounded-xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead className="hidden md:table-cell">Message</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Megaphone className="h-8 w-8" />
                    <p className="text-sm">No campaigns yet. Create your first campaign to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => (
                <TableRow key={campaign._id}>
                  <TableCell className="font-medium">
                    {campaign.name}
                    <p className="text-xs text-muted-foreground">
                      Cost: {campaign.cost} units
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs truncate">
                    {campaign.message}
                  </TableCell>
                  <TableCell>
                    <div>{campaign.recipientCount}</div>
                    <div className="text-xs text-muted-foreground">
                      ✓ {campaign.successCount} | ✗ {campaign.failedCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {['queued', 'processing'].includes(campaign.status) && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleCancelCampaign(campaign._id)}
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
