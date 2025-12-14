
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Book, Cloud } from 'lucide-react';

const Reports = () => {
  const reportTypes = [
    'Sales Summary',
    'Inventory Report', 
    'Customer Analysis',
    'Profit & Loss',
    'Low Stock Alert',
    'Product Performance'
  ];

  return (
    <div className="space-y-6 fade-in">
      <h2 className="text-2xl font-bold">Reports</h2>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="pipe-card">
          <CardContent className="p-4 text-center">
            <Book className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <p className="text-2xl font-bold">156</p>
            <p className="text-sm opacity-90">Reports Generated</p>
          </CardContent>
        </Card>
        
        <Card className="pipe-card">
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <p className="text-2xl font-bold">12</p>
            <p className="text-sm opacity-90">This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Generate Report */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type} value={type.toLowerCase()}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="pipe-button w-full">
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { name: 'Sales Summary - December', date: '2 days ago', size: '245 KB' },
            { name: 'Inventory Report - Q4', date: '1 week ago', size: '512 KB' },
            { name: 'Customer Analysis - November', date: '2 weeks ago', size: '189 KB' }
          ].map((report, index) => (
            <div key={index} className="p-4 border rounded-lg slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{report.name}</p>
                  <p className="text-sm text-muted-foreground">{report.date} • {report.size}</p>
                </div>
                <Cloud className="h-5 w-5 text-primary" />
              </div>
              
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1">
                  Download
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Share
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
