import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, FolderOpen, Trash2 } from "lucide-react";
import { groupsAPI } from "@/lib/api";

interface Group {
  _id: string;
  name: string;
  description?: string;
  contactCount: number;
  createdAt: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await groupsAPI.getAll();
      setGroups(res.data.data.groups);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!formData.name) return;
    
    try {
      await groupsAPI.create({
        name: formData.name,
        description: formData.description || undefined
      });
      setShowModal(false);
      setFormData({ name: "", description: "" });
      fetchGroups();
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    
    try {
      await groupsAPI.delete(id);
      fetchGroups();
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
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
        title="Contact Groups"
        description="Organize contacts into groups"
        actions={<Button className="gap-2" onClick={() => setShowModal(true)}><Plus className="h-4 w-4" /> Create Group</Button>}
      />

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 shadow-card text-muted-foreground">
          <FolderOpen className="h-12 w-12 mb-3" />
          <p className="text-sm">No groups yet. Create your first group to organize contacts.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group._id} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{group.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {group.contactCount} contacts
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDeleteGroup(group._id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              {group.description && (
                <p className="text-sm text-muted-foreground mt-2">{group.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Create New Group</h3>
            <div className="space-y-4">
              <div>
                <Label>Group Name *</Label>
                <Input 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Marketing, Customers"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input 
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleCreateGroup} disabled={!formData.name}>
                  Create Group
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
