import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Clock, 
  User, 
  Plus,
  Bell,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  BarChart2,
  LineChart,
  PieChart,
  Zap,
  DollarSign,
  ArrowUpRight,
  Lightbulb,
  BarChart,
  ArrowRight,
  ChevronDown,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart as RechartsBarChart,
  Cell, 
  Line, 
  LineChart as RechartsLineChart,
  Pie, 
  PieChart as RechartsPieChart,
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts';

const Dashboard = () => {
  // State for blinking effect on critical items
  const [blink, setBlink] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(false);

  // Blink effect for critical alerts
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(prev => !prev);
    }, 800);
    
    return () => clearInterval(blinkInterval);
  }, []);

  // Mock data for charts
  const salesData = [
    { name: 'Mon', sales: 2400, profit: 1200 },
    { name: 'Tue', sales: 1398, profit: 800 },
    { name: 'Wed', sales: 9800, profit: 3908 },
    { name: 'Thu', sales: 3908, profit: 2000 },
    { name: 'Fri', sales: 4800, profit: 2400 },
    { name: 'Sat', sales: 3800, profit: 1908 },
    { name: 'Sun', sales: 4300, profit: 2100 },
  ];

  const productCategoryData = [
    { name: 'Pipes & Plumbing', value: 35, color: '#1E40AF' },
    { name: 'Paint & Accessories', value: 25, color: '#3B82F6' },
    { name: 'Building Materials', value: 18, color: '#60A5FA' },
    { name: 'Electrical Supplies', value: 12, color: '#93C5FD' },
    { name: 'Others', value: 10, color: '#BFDBFE' },
  ];

  const inventoryTrendData = [
    { name: 'Jan', stock: 4000 },
    { name: 'Feb', stock: 3000 },
    { name: 'Mar', stock: 2000 },
    { name: 'Apr', stock: 2780 },
    { name: 'May', stock: 1890 },
    { name: 'Jun', stock: 2390 },
    { name: 'Jul', stock: 3490 },
  ];

  const topSellingProducts = [
    { name: 'PVC Pipe 2" x 10ft', sales: 234, growth: '+18%' },
    { name: 'Copper Fittings Set', sales: 187, growth: '+12%' },
    { name: 'Premium Paint Brush', sales: 156, growth: '+5%' },
    { name: 'Electrical Wire 14AWG', sales: 129, growth: '+9%' },
  ];

  const stats = [
    {
      title: 'Total Products',
      value: '1,248',
      change: '+12%',
      changeType: 'positive',
      icon: Database,
      trend: 'up'
    },
    {
      title: 'Low Stock Items',
      value: '23',
      change: '-5%',
      changeType: 'negative',
      icon: AlertTriangle,
      trend: 'down',
      alert: true
    },
    {
      title: 'Daily Sales',
      value: '$3,456',
      change: '+8%',
      changeType: 'positive',
      icon: Clock,
      trend: 'up'
    },
    {
      title: 'Customers',
      value: '567',
      change: '+3%',
      changeType: 'positive',
      icon: User,
      trend: 'up'
    },
  ];

  const recentActivity = [
    { action: 'New product added', item: 'PVC Pipe 2" x 10ft', time: '2 min ago', type: 'success' },
    { action: 'Stock updated', item: 'Paint Brush Set', time: '15 min ago', type: 'info' },
    { action: 'Sale completed', item: 'Customer: John Smith', time: '32 min ago', type: 'success' },
    { action: 'Low stock alert', item: 'Copper Fittings', time: '1 hour ago', type: 'warning' },
  ];

  // AI Insights and Recommendations
  const aiRecommendations = [
    {
      type: 'price',
      title: 'Price Optimization',
      description: 'Increase PVC Pipe 2" price by 5% to optimize profit margins based on current demand.',
      impact: 'Est. +$1,245 monthly revenue',
      confidence: '92%'
    },
    {
      type: 'inventory',
      title: 'Inventory Restock',
      description: 'Order Copper Fittings now to avoid stockout. Historical data shows increased demand in coming weeks.',
      impact: 'Prevent est. $3,450 lost sales',
      confidence: '87%'
    },
    {
      type: 'trend',
      title: 'Trending Product',
      description: 'Premium Paint Brushes are trending. Consider creating a promotional bundle with complementary products.',
      impact: 'Potential 15% sales increase',
      confidence: '78%'
    }
  ];

  const criticalAlerts = [
    { 
      product: 'PVC Elbow 90° (1.5")', 
      stock: 5, 
      reorderPoint: 10, 
      status: 'Critical',
      supplier: 'PipeMaster Supply Co.',
      lastOrdered: '45 days ago'
    },
    { 
      product: 'Copper Pipe Cleaner', 
      stock: 2, 
      reorderPoint: 8, 
      status: 'Urgent',
      supplier: 'CleanPro Industries',
      lastOrdered: '60 days ago'
    },
    { 
      product: 'Electrical Tape (Black)', 
      stock: 7, 
      reorderPoint: 15, 
      status: 'Warning',
      supplier: 'ElectroSupplies Inc.',
      lastOrdered: '30 days ago'
    }
  ];

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'warning': return <div className="w-2 h-2 bg-orange-500 rounded-full"></div>;
      case 'info': return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
      default: return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'price': return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'inventory': return <Database className="h-5 w-5 text-blue-500" />;
      case 'trend': return <TrendingUp className="h-5 w-5 text-purple-500" />;
      default: return <Lightbulb className="h-5 w-5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6 fade-in mobile-optimized pb-20">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <Button variant="ghost" size="icon" className="rounded-full">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Grid with Animation */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className={`pipe-card-dark scale-in ${stat.alert && blink ? 'animate-pulse border-red-500' : ''}`} 
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`h-8 w-8 opacity-80 text-white ${stat.alert && blink ? 'text-red-300' : ''}`} />
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-red-400 rotate-180" />
                  )}
                </div>
                <div>
                  <p className="text-sm opacity-90 text-white">{stat.title}</p>
                  <p className={`text-2xl font-bold text-white mb-1 ${stat.alert && blink ? 'text-red-300' : ''}`}>{stat.value}</p>
                  <p className={`text-xs ${
                    stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stat.change} from yesterday
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI Insights Button */}
      <Button 
        onClick={() => setShowAiInsights(!showAiInsights)}
        className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white rounded-xl py-3 flex items-center justify-between shadow-lg border border-indigo-700/20"
      >
        <div className="flex items-center">
          <div className="bg-white/20 p-1.5 rounded-lg mr-3">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-medium">AI Business Insights</span>
        </div>
        <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${showAiInsights ? 'rotate-180' : ''}`} />
      </Button>

      {/* AI Recommendations */}
      {showAiInsights && (
        <Card className="pipe-card border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-indigo-800 flex items-center gap-2 font-semibold">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              AI-Powered Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiRecommendations.map((rec, index) => (
              <div key={index} className="bg-white/80 rounded-xl p-4 border border-indigo-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    {getRecommendationIcon(rec.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-indigo-900">{rec.title}</h3>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        {rec.confidence} confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium text-green-700">{rec.impact}</span>
                      <Button variant="ghost" size="sm" className="text-indigo-600 p-0 h-auto">
                        Apply <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sales Performance Chart */}
      <Card className="pipe-card fade-in" style={{ animationDelay: '0.3s' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <BarChart2 className="h-5 w-5 mr-2 text-primary" />
            Sales Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[180px] mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1E40AF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#1E40AF" strokeWidth={2} fillOpacity={1} fill="url(#salesGradient)" />
                <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#profitGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-primary mr-1"></div>
              <span className="text-xs text-gray-600">Sales</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
              <span className="text-xs text-gray-600">Profit</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Category Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="pipe-card fade-in" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-primary" />
              Product Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[160px] flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={productCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {productCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [`${value}%`, 'Percentage']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {productCategoryData.slice(0, 4).map((category, index) => (
                <div key={index} className="flex items-center text-xs">
                  <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: category.color }}></div>
                  <span className="text-gray-600 truncate">{category.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Trend */}
        <Card className="pipe-card fade-in" style={{ animationDelay: '0.5s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <LineChart className="h-5 w-5 mr-2 text-primary" />
              Inventory Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={inventoryTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line type="monotone" dataKey="stock" stroke="#1E40AF" strokeWidth={2} dot={{ r: 3 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Products */}
      <Card className="pipe-card fade-in" style={{ animationDelay: '0.6s' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <BarChart className="h-5 w-5 mr-2 text-primary" />
            Top Selling Products
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topSellingProducts.map((product, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary font-semibold rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.sales} units sold</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                {product.growth}
                <ArrowUpRight className="h-3 w-3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Critical Stock Alerts with Blinking Effect */}
      <Card 
        className={`pipe-card border-red-200 bg-gradient-to-r from-red-50 to-orange-50 fade-in ${blink ? 'shadow-red-200' : ''}`} 
        style={{ animationDelay: '0.7s' }}
      >
        <CardHeader className="pb-2">
          <CardTitle className={`text-lg text-red-800 flex items-center gap-2 font-semibold ${blink ? 'text-red-600' : ''}`}>
            <Bell className={`h-5 w-5 ${blink ? 'text-red-600' : 'text-red-500'}`} />
            Critical Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {criticalAlerts.map((alert, index) => (
            <div 
              key={index} 
              className={`flex items-center justify-between p-3 rounded-lg ${
                alert.status === 'Critical' 
                  ? `${blink ? 'bg-red-100' : 'bg-white/60'} border border-red-200` 
                  : alert.status === 'Urgent'
                    ? `${blink ? 'bg-orange-100' : 'bg-white/60'} border border-orange-200`
                    : 'bg-white/60 border border-yellow-200'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`font-medium ${
                    alert.status === 'Critical' ? 'text-red-700' : 
                    alert.status === 'Urgent' ? 'text-orange-700' : 'text-yellow-700'
                  }`}>
                    {alert.product}
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    alert.status === 'Critical' ? 'bg-red-100 text-red-800 border border-red-200' : 
                    alert.status === 'Urgent' ? 'bg-orange-100 text-orange-800 border border-orange-200' : 
                    'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {alert.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">{alert.stock}</span> units left (min: {alert.reorderPoint})
                  </p>
                  <p className="text-xs text-gray-500">
                    Last ordered: {alert.lastOrdered}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className={`h-1.5 rounded-full ${
                      alert.status === 'Critical' ? 'bg-red-500' : 
                      alert.status === 'Urgent' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${(alert.stock / alert.reorderPoint) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            className={`mt-3 border-red-300 hover:bg-red-100 transition-colors duration-300 w-full ${
              blink ? 'text-red-700 bg-red-50' : 'text-red-600'
            }`}
          >
            Reorder All Critical Items
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="pipe-card fade-in" style={{ animationDelay: '0.8s' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Clock className="h-5 w-5 mr-2 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                {getActivityTypeIcon(activity.type)}
                <div>
                  <p className="font-medium text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.item}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{activity.time}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="pt-0">
          <Button variant="ghost" size="sm" className="w-full text-primary hover:bg-primary/5">
            View All Activity
          </Button>
        </CardFooter>
      </Card>

      {/* Quick Actions */}
      <Card className="pipe-card fade-in" style={{ animationDelay: '0.9s' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="pipe-button w-full justify-start" size="lg">
            <Plus className="mr-3 h-5 w-5" />
            Add New Product
          </Button>
          <Button variant="outline" className="w-full justify-start hover:bg-primary/5 transition-colors duration-300" size="lg">
            <Clock className="mr-3 h-5 w-5 text-primary" />
            Record Sale
          </Button>
          <Button variant="outline" className="w-full justify-start hover:bg-primary/5 transition-colors duration-300" size="lg">
            <User className="mr-3 h-5 w-5 text-primary" />
            Add Customer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
