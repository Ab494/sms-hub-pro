import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, MessageSquare, Upload, FileSpreadsheet, FileText, Download, AlertCircle } from "lucide-react";
import { smsAPI, groupsAPI, contactsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface Group {
  _id: string;
  name: string;
  contactCount: number;
}

interface ImportedContact {
  name?: string;
  phone: string;
}

const MAX_CHARS = 160;

export default function SendSmsPage() {
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("none");
  const [groups, setGroups] = useState<Group[]>([]);
  const [sendingMode, setSendingMode] = useState<"single" | "bulk" | "import">("single");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importedContacts, setImportedContacts] = useState<ImportedContact[]>([]);
  const [importPreview, setImportPreview] = useState<string>("");
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

  // Calculate cost display text
  const getCostDisplay = () => {
    if (sendingMode === "single") {
      return (smsCount * 0.46).toFixed(2);
    } else if (sendingMode === "bulk") {
      if (selectedGroup && selectedGroup !== "none") {
        return `${groups.find(g => g._id === selectedGroup)?.contactCount || 0} × ${smsCount} SMS`;
      } else {
        return `${getPhoneCount()} × ${smsCount} SMS`;
      }
    } else if (sendingMode === "import") {
      return `${importedContacts.length} × ${smsCount} SMS = ${(importedContacts.length * smsCount * 0.46).toFixed(2)}`;
    }
    return "0.00";
  };

  // Get phone count for bulk mode
  const getPhoneCount = () => {
    return phone.split(/[\n,]/).filter(Boolean).length || 0;
  };

  // Calculate actual cost for estimation
  const getEstimatedCost = () => {
    if (sendingMode === "single") {
      return smsCount * 0.46;
    } else if (sendingMode === "bulk") {
      if (selectedGroup && selectedGroup !== "none") {
        return (groups.find(g => g._id === selectedGroup)?.contactCount || 0) * smsCount * 0.46;
      } else {
        return getPhoneCount() * smsCount * 0.46;
      }
    } else if (sendingMode === "import") {
      return importedContacts.length * smsCount * 0.46;
    }
    return 0;
  };

  const handleSendSingle = async () => {
    if (!phone || !message) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter phone number and message"
      });
      return;
    }

    // Validate phone number format
    const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
    const cleanPhone = phone.replace(/\s+/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid Kenyan phone number (e.g., 0712345678 or +254712345678)"
      });
      return;
    }

    setLoading(true);
    try {
      const res = await smsAPI.send({ phone: cleanPhone, message });
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
    const hasGroupSelected = selectedGroup && selectedGroup !== "none";
    if (!message || (!hasGroupSelected && !phone)) {
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
        groupId: hasGroupSelected ? selectedGroup : undefined,
        phones: phones.length > 0 ? phones : undefined,
        name: `Bulk SMS - ${phones.length || 'Group'} recipients`
      });

      toast({
        title: "Success",
        description: res.data.message || "SMS campaign queued"
      });
      setPhone("");
      setMessage("");
      setSelectedGroup("none");
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)"
      });
      return;
    }

    setUploadedFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await smsAPI.uploadContacts(formData);
      setImportedContacts(response.data.data.contacts);
      setImportPreview(`Found ${response.data.data.contacts.length} contacts with valid phone numbers`);

      toast({
        title: "File Uploaded",
        description: `Successfully parsed ${response.data.data.contacts.length} contacts`
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to parse file"
      });
      setUploadedFile(null);
      setImportedContacts([]);
      setImportPreview("");
    }
  };

  const handleSendImport = async () => {
    if (!message || importedContacts.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a message and upload a valid file"
      });
      return;
    }

    setLoading(true);
    try {
      const phones = importedContacts.map(contact => contact.phone);

      const res = await smsAPI.sendBulk({
        message,
        phones,
        name: `Import SMS - ${phones.length} recipients`
      });

      toast({
        title: "Success",
        description: res.data.message || "Import SMS campaign queued"
      });
      setMessage("");
      setUploadedFile(null);
      setImportedContacts([]);
      setImportPreview("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to send import SMS"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Send SMS" description="Compose and send a new SMS message" />

      {/* New Feature Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <Upload className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900">New Feature: Import Contacts</h3>
            <p className="text-sm text-blue-700">
              Upload CSV or Excel files to send SMS to hundreds of contacts at once. Click the "Import CSV/Excel" tab above.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-5">
          <Tabs value={sendingMode} onValueChange={(value) => setSendingMode(value as "single" | "bulk" | "import")}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Single SMS
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Bulk SMS
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import CSV/Excel
              </TabsTrigger>
            </TabsList>

            {/* Single SMS Tab */}
            <TabsContent value="single" className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Send Single SMS</CardTitle>
                  <CardDescription>Send a message to one recipient</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Phone Input */}
                  <div className="space-y-2">
                    <Label htmlFor="single-phone">Phone Number</Label>
                    <Input
                      id="single-phone"
                      placeholder="+254 7XX XXX XXX"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>

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
                    onClick={handleSendSingle}
                    disabled={loading || !message || !phone}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send SMS
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bulk SMS Tab */}
            <TabsContent value="bulk" className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Send Bulk SMS</CardTitle>
                  <CardDescription>Send messages to multiple recipients or groups</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Phone Input */}
                  <div className="space-y-2">
                    <Label htmlFor="bulk-phone">Phone Numbers (optional)</Label>
                    <Textarea
                      id="bulk-phone"
                      placeholder="0712345678,0712345679,0712345680"
                      rows={3}
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter phone numbers separated by commas, or select a group below
                    </p>
                  </div>

                  {/* Group Selection */}
                  <div className="space-y-2">
                    <Label>Contact Group</Label>
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No group - use phone numbers above</SelectItem>
                        {groups.map((group) => (
                          <SelectItem key={group._id} value={group._id}>
                            {group.name} ({group.contactCount} contacts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                    onClick={handleSendBulk}
                    disabled={loading || !message || (!phone && selectedGroup === "none")}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send Bulk SMS
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Import File Tab */}
            <TabsContent value="import" className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Import from File</CardTitle>
                  <CardDescription>Upload a CSV or Excel file to send SMS to multiple contacts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label>Upload File</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          CSV or Excel files (.csv, .xlsx, .xls)
                        </p>
                      </label>
                    </div>

                    {uploadedFile && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        {uploadedFile.name.endsWith('.csv') ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <FileSpreadsheet className="h-4 w-4" />
                        )}
                        <span className="text-sm">{uploadedFile.name}</span>
                      </div>
                    )}

                    {importPreview && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">{importPreview}</p>
                      </div>
                    )}
                  </div>

                  {/* Expected Format Info */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Expected File Format</h4>
                    <p className="text-xs text-blue-700 mb-2">
                      Your file should have columns for contact information. The system will automatically detect phone numbers.
                    </p>
                    <div className="text-xs text-blue-700 mb-3">
                      <strong>Supported columns:</strong> phone, telephone, mobile, contact, number<br/>
                      <strong>Example:</strong> name, phone → John Doe, +254712345678
                    </div>
                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Download sample CSV
                          const csvContent = "name,phone,email,company\nJohn Kamau,+254712345678,john.kamau@email.com,Kamau Enterprises\nMary Wanjiku,0712345679,mary.wanjiku@email.com,Wanjiku Solutions\nDavid Kiprop,7123456780,david.kiprop@email.com,Kiprop Tech\nSarah Achieng,+254723456781,sarah.achieng@email.com,Achieng Consulting\n";
                          const blob = new Blob([csvContent], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'sample-contacts.csv';
                          a.click();
                          window.URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-3 w-3" />
                        Download Sample CSV
                      </Button>
                      <div className="text-xs text-blue-600 self-center">
                        Contains 10 sample contacts
                      </div>
                    </div>
                  </div>

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
                      <span>{smsCount} SMS per contact</span>
                    </div>
                  </div>

                  {importedContacts.length > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>{importedContacts.length}</strong> contacts ready to receive SMS
                        {importedContacts.length > 0 && ` (estimated cost: KES ${(importedContacts.length * smsCount * 0.46).toFixed(2)})`}
                      </p>
                    </div>
                  )}

                  <Button
                    className="w-full sm:w-auto gap-2"
                    onClick={handleSendImport}
                    disabled={loading || !message || importedContacts.length === 0}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send to {importedContacts.length} Contacts
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>



            {/* Group Selection (Bulk only) */}
            {sendingMode === "bulk" && (
              <div className="space-y-2">
                <Label>Contact Group</Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group (optional)" />
                  </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="none">No group - use phone numbers above</SelectItem>
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
              disabled={loading || !message || (sendingMode === "single" ? !phone : (!phone && selectedGroup === "none"))}
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
                  : sendingMode === "bulk"
                    ? selectedGroup && selectedGroup !== "none"
                      ? `To: Group (${groups.find(g => g._id === selectedGroup)?.name})`
                      : `To: ${getPhoneCount()} numbers`
                    : sendingMode === "import"
                      ? `To: ${importedContacts.length} imported contacts`
                      : "—"
                }
              </p>
              <p className="text-sm whitespace-pre-wrap">{message || "Your message will appear here..."}</p>
            </div>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <p>Rate: KES 0.46 per SMS</p>
              <p>
                Estimated cost: KES {
                  sendingMode === "single"
                    ? (smsCount * 0.46).toFixed(2)
                      : getCostDisplay()
                }
              </p>
            </div>
          </div>
        </div>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <p>Rate: KES 0.46 per SMS</p>
              <p>Estimated cost: KES {getEstimatedCost().toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
