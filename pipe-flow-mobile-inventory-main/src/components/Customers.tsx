
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, User } from 'lucide-react';

const Customers = () => {
  const customers = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      totalPurchases: 1450.75,
      lastVisit: '2 days ago'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '(555) 987-6543',
      totalPurchases: 892.50,
      lastVisit: '1 week ago'
    },
    {
      id: 3,
      name: 'Mike Wilson',
      email: 'mike.wilson@email.com',
      phone: '(555) 456-7890',
      totalPurchases: 2150.00,
      lastVisit: '3 days ago'
    }
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customers</h2>
        <Button className="pipe-button">
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customers..." className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {/* Customer Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="pipe-card">
          <CardContent className="p-4 text-center">
            <User className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <p className="text-2xl font-bold">567</p>
            <p className="text-sm opacity-90">Total Customers</p>
          </CardContent>
        </Card>
        
        <Card className="pipe-card">
          <CardContent className="p-4 text-center">
            <User className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <p className="text-2xl font-bold">23</p>
            <p className="text-sm opacity-90">New This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <div className="space-y-4">
        {customers.map((customer, index) => (
          <Card key={customer.id} className="slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{customer.name}</h3>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">${customer.totalPurchases}</p>
                  <p className="text-xs text-muted-foreground">Total Purchases</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Visit</p>
                  <p className="font-medium">{customer.lastVisit}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Purchase History
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Customers;
