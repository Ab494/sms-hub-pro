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
    if (!phone) return 0;
    const lines = phone.split('\n');
    let count = 0;
    for (const line of lines) {
      const numbers = line.split(',');
      for (const num of numbers) {
        if (num.trim() !== '') count++;
      }
    }
    return count;
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

    // Validate phone number format - Kenyan numbers only
    let cleanPhone = phone.split(' ').join('');
    const startsWithValidPrefix = cleanPhone.startsWith('+254') || cleanPhone.startsWith('254') || cleanPhone.startsWith('0');
    const hasValidLength = cleanPhone.length >= 9 && cleanPhone.length <= 13;
    let digitsOnly = cleanPhone;
    if (digitsOnly.startsWith('+254')) {
      digitsOnly = digitsOnly.slice(4);
    } else if (digitsOnly.startsWith('254')) {
      digitsOnly = digitsOnly.slice(3);
    } else if (digitsOnly.startsWith('0')) {
      digitsOnly = digitsOnly.slice(1);
    }
    const hasValidDigits = digitsOnly.length > 0 && !isNaN(Number(digitsOnly));
    const startsWithValidDigit = digitsOnly.startsWith('7') || digitsOnly.startsWith('1');
    const isValidKenyaNumber = startsWithValidPrefix && hasValidLength && hasValidDigits && startsWithValidDigit;
    if (!isValidKenyaNumber) {
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
        const lines = phone.split('\n');
        for (const line of lines) {
          const numbers = line.split(',');
          for (const num of numbers) {
            const trimmed = num.trim();
            if (trimmed !== '') phones.push(trimmed);
          }
        }
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
            <TabsList className="grid w-full grid-cols-3">
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
            <TabsContent value="single" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Send Single SMS</CardTitle>
                  <CardDescription>Send an SMS to one recipient</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="single-phone">Phone Number</Label>
                    <Input
                      id="single-phone"
                      placeholder="0712345678 or +254712345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="single-message">Message</Label>
                    <Textarea
                      id="single-message"
                      placeholder="Enter your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{charCount}/{MAX_CHARS} characters</span>
                      <span>{smsCount} SMS ({(smsCount * 0.46).toFixed(2)} KES)</span>
                    </div>
                  </div>
                  <Button onClick={handleSendSingle} disabled={loading} className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? "Sending..." : "Send SMS"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bulk SMS Tab */}
            <TabsContent value="bulk" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Send Bulk SMS</CardTitle>
                  <CardDescription>Send SMS to multiple recipients or groups</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Recipients</Label>
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a group or enter phone numbers below" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Enter phone numbers manually</SelectItem>
                        {groups.map((group) => (
                          <SelectItem key={group._id} value={group._id}>
                            {group.name} ({group.contactCount} contacts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedGroup === "none" && (
                    <div>
                      <Label htmlFor="bulk-phones">Phone Numbers</Label>
                      <Textarea
                        id="bulk-phones"
                        placeholder="Enter phone numbers (one per line or comma-separated)&#10;0712345678&#10;0723456789,0734567890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        rows={4}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {getPhoneCount()} phone numbers detected
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="bulk-message">Message</Label>
                    <Textarea
                      id="bulk-message"
                      placeholder="Enter your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{charCount}/{MAX_CHARS} characters</span>
                      <span>{getCostDisplay()}</span>
                    </div>
                  </div>
                  <Button onClick={handleSendBulk} disabled={loading} className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? "Sending..." : "Send Bulk SMS"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Import CSV/Excel Tab */}
            <TabsContent value="import" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Import from CSV/Excel</CardTitle>
                  <CardDescription>Upload a file to send SMS to multiple contacts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Download Sample File */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Download Sample File</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Download a sample CSV file to see the correct format for your contacts.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/sample-contacts.csv', '_blank')}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Download Sample CSV
                    </Button>
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label htmlFor="file-upload">Upload File</Label>
                    <div className="mt-1">
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        className="cursor-pointer"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supported formats: CSV, Excel (.xlsx, .xls)
                    </p>
                  </div>

                  {/* Import Preview */}
                  {importPreview && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Import Preview</span>
                      </div>
                      <p className="text-sm text-green-800 mt-1">{importPreview}</p>
                    </div>
                  )}

                  {/* Error State */}
                  {uploadedFile && importedContacts.length === 0 && !importPreview.includes("Found") && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-900">Import Failed</span>
                      </div>
                      <p className="text-sm text-red-800 mt-1">
                        No valid phone numbers found in the file. Please check the format and try again.
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="import-message">Message</Label>
                    <Textarea
                      id="import-message"
                      placeholder="Enter your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{charCount}/{MAX_CHARS} characters</span>
                      <span>{getCostDisplay()}</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleSendImport}
                    disabled={loading || importedContacts.length === 0}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {loading ? "Sending..." : "Send to Imported Contacts"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>SMS Cost Calculator</CardTitle>
              <CardDescription>Estimate the cost of your SMS campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Recipients:</span>
                  <span className="text-sm font-medium">
                    {sendingMode === "single" ? "1" :
                     sendingMode === "bulk" ? (selectedGroup && selectedGroup !== "none" ? (groups.find(g => g._id === selectedGroup)?.contactCount || 0) : getPhoneCount()) :
                     importedContacts.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">SMS Count:</span>
                  <span className="text-sm font-medium">{smsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cost per SMS:</span>
                  <span className="text-sm font-medium">0.46 KES</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Cost:</span>
                    <span>{getEstimatedCost().toFixed(2)} KES</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• SMS messages are limited to 160 characters per SMS.</p>
              <p>• Phone numbers should be in Kenyan format (0712345678 or +254712345678).</p>
              <p>• Bulk SMS to groups is more efficient than manual entry.</p>
              <p>• CSV files should have columns named 'name' and 'phone'.</p>
              <p>• Invalid phone numbers will be skipped automatically.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
