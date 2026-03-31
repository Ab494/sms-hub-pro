import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  Save, 
  RefreshCw, 
  DollarSign, 
  MessageSquare, 
  CreditCard,
  Settings as SettingsIcon
} from 'lucide-react';
import { adminAPI } from '@/lib/api';

interface PlatformSettings {
  sms_price_per_unit: number;
  sms_cost_per_unit: number;
  minimum_credit_purchase: number;
  bonus_credits_percent: number;
  currency: string;
  default_sender_id: string;
  payment_methods: string[];
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlatformSettings>({
    sms_price_per_unit: 0.5,
    sms_cost_per_unit: 0.35,
    minimum_credit_purchase: 100,
    bonus_credits_percent: 0,
    currency: 'KES',
    default_sender_id: 'FERRITE',
    payment_methods: ['mpesa', 'bank_transfer']
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('pricing');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSettings();
      setSettings({
        sms_price_per_unit: response.data.data.sms_price_per_unit || 0.5,
        sms_cost_per_unit: response.data.data.sms_cost_per_unit || 0.35,
        minimum_credit_purchase: response.data.data.minimum_credit_purchase || 100,
        bonus_credits_percent: response.data.data.bonus_credits_percent || 0,
        currency: response.data.data.currency || 'KES',
        default_sender_id: response.data.data.default_sender_id || 'FERRITE',
        payment_methods: response.data.data.payment_methods || ['mpesa', 'bank_transfer']
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to fetch settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminAPI.updateSettings(settings);
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof PlatformSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">Configure global platform settings and pricing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="pricing">
            <DollarSign className="h-4 w-4 mr-2" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="sms">
            <MessageSquare className="h-4 w-4 mr-2" />
            SMS Settings
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
        </TabsList>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Configuration</CardTitle>
              <CardDescription>
                Set the price you charge customers and your cost from BlessedTexts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sms_price_per_unit">Price per SMS (KES)</Label>
                  <Input
                    id="sms_price_per_unit"
                    type="number"
                    step="0.01"
                    value={settings.sms_price_per_unit}
                    onChange={(e) => handleChange('sms_price_per_unit', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Price charged to customers per SMS segment
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sms_cost_per_unit">Cost per SMS (KES)</Label>
                  <Input
                    id="sms_cost_per_unit"
                    type="number"
                    step="0.01"
                    value={settings.sms_cost_per_unit}
                    onChange={(e) => handleChange('sms_cost_per_unit', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cost you pay BlessedTexts per SMS segment
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="minimum_credit_purchase">Minimum Credit Purchase</Label>
                    <Input
                      id="minimum_credit_purchase"
                      type="number"
                      value={settings.minimum_credit_purchase}
                      onChange={(e) => handleChange('minimum_credit_purchase', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum credits a user can purchase at once
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bonus_credits_percent">Bonus Credits (%)</Label>
                    <Input
                      id="bonus_credits_percent"
                      type="number"
                      value={settings.bonus_credits_percent}
                      onChange={(e) => handleChange('bonus_credits_percent', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Extra credits given as bonus on purchase
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={settings.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Profit Calculation</h4>
                <div className="text-sm text-muted-foreground">
                  <p>Profit per SMS: KES {(settings.sms_price_per_unit - settings.sms_cost_per_unit).toFixed(2)}</p>
                  <p>Margin: {((settings.sms_price_per_unit - settings.sms_cost_per_unit) / settings.sms_price_per_unit * 100).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Settings Tab */}
        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMS Configuration</CardTitle>
              <CardDescription>
                Configure default SMS sender and other SMS-related settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="default_sender_id">Default Sender ID</Label>
                <Input
                  id="default_sender_id"
                  value={settings.default_sender_id}
                  onChange={(e) => handleChange('default_sender_id', e.target.value.toUpperCase())}
                  maxLength={11}
                />
                <p className="text-xs text-muted-foreground">
                  The default sender ID for SMS messages (max 11 characters, alphanumeric)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Configure available payment methods for credit purchases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="mpesa"
                      checked={settings.payment_methods.includes('mpesa')}
                      onChange={(e) => {
                        const methods = e.target.checked
                          ? [...settings.payment_methods, 'mpesa']
                          : settings.payment_methods.filter(m => m !== 'mpesa');
                        handleChange('payment_methods', methods);
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="mpesa" className="font-medium">M-Pesa</Label>
                  </div>
                  <span className="text-sm text-muted-foreground">STK Push payments</span>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="bank_transfer"
                      checked={settings.payment_methods.includes('bank_transfer')}
                      onChange={(e) => {
                        const methods = e.target.checked
                          ? [...settings.payment_methods, 'bank_transfer']
                          : settings.payment_methods.filter(m => m !== 'bank_transfer');
                        handleChange('payment_methods', methods);
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="bank_transfer" className="font-medium">Bank Transfer</Label>
                  </div>
                  <span className="text-sm text-muted-foreground">Manual bank transfer</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}