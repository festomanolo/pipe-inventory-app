
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, Bell, Database, Cloud, User, Info } from 'lucide-react';
import { useState } from 'react';
import About from './About';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('settings');

  if (activeSection === 'about') {
    return <About />;
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Settings</h2>
        <Button
          onClick={() => setActiveSection('about')}
          className="pipe-button flex items-center gap-2"
        >
          <Info className="h-4 w-4" />
          About Developer
        </Button>
      </div>

      {/* Company Information */}
      <Card className="pipe-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" defaultValue="Pipe Flow Hardware Store" className="pipe-input" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" defaultValue="123 Main Street, City, State 12345" className="pipe-input" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" defaultValue="(555) 123-4567" className="pipe-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue="info@pipeflow.com" className="pipe-input" />
            </div>
          </div>

          <Button className="pipe-button w-full">
            Save Company Info
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="pipe-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Low Stock Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Daily Sales Report</p>
              <p className="text-sm text-muted-foreground">Receive daily sales summary via email</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Customer Updates</p>
              <p className="text-sm text-muted-foreground">Notifications for new customers and orders</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Tax & Currency */}
      <Card className="pipe-card">
        <CardHeader>
          <CardTitle>Tax & Currency Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input id="taxRate" type="number" defaultValue="8.5" step="0.1" className="pipe-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" defaultValue="USD" className="pipe-input" />
            </div>
          </div>
          
          <Button className="pipe-button w-full">
            Save Tax Settings
          </Button>
        </CardContent>
      </Card>

      {/* Data & Sync */}
      <Card className="pipe-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto Sync</p>
              <p className="text-sm text-muted-foreground">Automatically sync data to cloud</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              Backup Data
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Restore Data
            </Button>
          </div>
          
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">Last sync: 2 minutes ago</p>
            <p className="text-sm text-muted-foreground">Next backup: Tonight at 2:00 AM</p>
          </div>
        </CardContent>
      </Card>

      {/* App Version */}
      <Card className="pipe-card">
        <CardContent className="p-4 text-center">
          <p className="font-semibold">Pipe Inventory Management</p>
          <p className="text-sm opacity-90">Version 1.0.0</p>
          <p className="text-xs opacity-75 mt-2">Built for mobile excellence by Festomanolo</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
