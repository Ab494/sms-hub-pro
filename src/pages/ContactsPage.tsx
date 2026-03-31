import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Upload, Search, Users, Pencil, Trash2 } from "lucide-react";
import { contactsAPI, groupsAPI } from "@/lib/api";

interface Contact {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  groupId?: { _id: string; name: string };
  createdAt: string;
}

interface Group {
  _id: string;
  name: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", groupId: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [contactsRes, groupsRes] = await Promise.all([
        contactsAPI.getAll({ limit: 100 }),
        groupsAPI.getAll()
      ]);
      setContacts(contactsRes.data.data.contacts);
      setGroups(groupsRes.data.data.groups);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await contactsAPI.getAll({ search, limit: 100 });
      setContacts(res.data.data.contacts);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    try {
      await contactsAPI.create({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        groupId: formData.groupId || undefined
      });
      setShowAddModal(false);
      setFormData({ name: "", phone: "", email: "", groupId: "" });
      fetchData();
    } catch (error) {
      console.error("Failed to add contact:", error);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      await contactsAPI.delete(id);
      fetchData();
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await contactsAPI.import(formData);
      alert(res.data.message);
      fetchData();
    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to import contacts");
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
        title="Contacts"
        description="Manage your contact list"
        actions={
          <>
            <label>
              <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
              <Button variant="outline" className="gap-2 cursor-pointer">
                <Upload className="h-4 w-4" /> Import CSV
              </Button>
            </label>
            <Button className="gap-2" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" /> Add Contact
            </Button>
          </>
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 border-b border-border">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search contacts..." 
              className="pl-9" 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Group</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8" />
                    <p className="text-sm">No contacts yet. Add your first contact to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact._id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>
                    {contact.groupId ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {contact.groupId.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleDeleteContact(contact._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Add New Contact</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter contact name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone *</label>
                <Input 
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="254700000000"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input 
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Group</label>
                <select 
                  value={formData.groupId}
                  onChange={e => setFormData({ ...formData, groupId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a group</option>
                  {groups.map(group => (
                    <option key={group._id} value={group._id}>{group.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleAddContact} disabled={!formData.name || !formData.phone}>
                  Add Contact
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
