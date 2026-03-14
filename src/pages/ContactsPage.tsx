import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Search, Pencil, Trash2 } from "lucide-react";

const contacts = [
  { id: 1, name: "John Doe", phone: "+1 234 567 8901", group: "Customers" },
  { id: 2, name: "Jane Smith", phone: "+1 234 567 8902", group: "VIP Clients" },
  { id: 3, name: "Robert Brown", phone: "+1 234 567 8903", group: "Leads" },
  { id: 4, name: "Emily Davis", phone: "+1 234 567 8904", group: "Customers" },
  { id: 5, name: "Michael Wilson", phone: "+1 234 567 8905", group: "Leads" },
  { id: 6, name: "Sarah Johnson", phone: "+1 234 567 8906", group: "VIP Clients" },
];

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Manage your contact list"
        actions={
          <>
            <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" /> Import CSV</Button>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Contact</Button>
          </>
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="p-4 border-b border-border">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search contacts..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
            {filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                <TableCell><Badge variant="secondary">{c.group}</Badge></TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
