
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Clock, User } from 'lucide-react';

const Sales = () => {
  const recentSales = [
    {
      id: 'TXN-001',
      customer: 'John Smith',
      items: 3,
      total: 124.50,
      time: '2 hours ago',
      status: 'Completed'
    },
    {
      id: 'TXN-002', 
      customer: 'Sarah Johnson',
      items: 1,
      total: 45.99,
      time: '4 hours ago',
      status: 'Completed'
    },
    {
      id: 'TXN-003',
      customer: 'Mike Wilson',
      items: 7,
      total: 299.75,
      time: '1 day ago',
      status: 'Completed'
    }
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sales</h2>
        <Button className="pipe-button">
          <Plus className="mr-2 h-4 w-4" />
          New Sale
        </Button>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="pipe-card">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <p className="text-2xl font-bold">$3,456</p>
            <p className="text-sm opacity-90">Today's Sales</p>
          </CardContent>
        </Card>
        
        <Card className="pipe-card">
          <CardContent className="p-4 text-center">
            <User className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <p className="text-2xl font-bold">47</p>
            <p className="text-sm opacity-90">Transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentSales.map((sale, index) => (
            <div key={sale.id} className="p-4 border rounded-lg slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{sale.id}</p>
                  <p className="text-sm text-muted-foreground">{sale.customer}</p>
                </div>
                <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">
                  {sale.status}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Items</p>
                  <p className="font-medium">{sale.items}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">${sale.total}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-medium">{sale.time}</p>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full mt-3">
                View Details
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Sales;
