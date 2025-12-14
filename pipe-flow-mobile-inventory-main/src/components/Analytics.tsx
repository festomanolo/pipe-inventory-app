
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Eye } from 'lucide-react';

const Analytics = () => {
  // Sample data for charts
  const salesData = [
    { month: 'Jan', sales: 45000, orders: 120, customers: 89 },
    { month: 'Feb', sales: 52000, orders: 135, customers: 102 },
    { month: 'Mar', sales: 48000, orders: 128, customers: 95 },
    { month: 'Apr', sales: 61000, orders: 156, customers: 118 },
    { month: 'May', sales: 55000, orders: 142, customers: 108 },
    { month: 'Jun', sales: 67000, orders: 178, customers: 134 },
  ];

  const inventoryData = [
    { category: 'Steel Pipes', value: 35, color: 'rgb(99, 102, 241)' },
    { category: 'PVC Pipes', value: 28, color: 'rgb(139, 92, 246)' },
    { category: 'Copper Pipes', value: 20, color: 'rgb(59, 130, 246)' },
    { category: 'Fittings', value: 17, color: 'rgb(16, 185, 129)' },
  ];

  const revenueData = [
    { day: 'Mon', revenue: 8500 },
    { day: 'Tue', revenue: 9200 },
    { day: 'Wed', revenue: 7800 },
    { day: 'Thu', revenue: 10500 },
    { day: 'Fri', revenue: 12000 },
    { day: 'Sat', revenue: 6500 },
    { day: 'Sun', revenue: 5200 },
  ];

  const performanceMetrics = [
    {
      title: 'Total Revenue',
      value: '$342,890',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-400'
    },
    {
      title: 'Total Orders',
      value: '1,259',
      change: '+8.2%',
      trend: 'up',
      icon: Package,
      color: 'text-blue-400'
    },
    {
      title: 'Active Customers',
      value: '846',
      change: '-2.1%',
      trend: 'down',
      icon: Users,
      color: 'text-orange-400'
    },
    {
      title: 'Page Views',
      value: '24,891',
      change: '+15.3%',
      trend: 'up',
      icon: Eye,
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="space-y-8 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights and performance metrics
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <div 
              key={metric.title}
              className="pipe-card p-6 hover:scale-105 transition-all duration-500"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${metric.color} bg-opacity-20`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  metric.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  <TrendIcon className="h-4 w-4" />
                  {metric.change}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">{metric.value}</h3>
                <p className="text-muted-foreground text-sm">{metric.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Trend Chart */}
        <div className="pipe-card p-6 slide-up">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            Sales Trend Analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(99, 102, 241)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="rgb(99, 102, 241)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgb(148, 163, 184)" />
              <YAxis stroke="rgb(148, 163, 184)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="rgb(99, 102, 241)" 
                strokeWidth={3}
                fill="url(#salesGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="pipe-card p-6 slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            Daily Revenue
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="rgb(148, 163, 184)" />
              <YAxis stroke="rgb(148, 163, 184)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)'
                }} 
              />
              <Bar 
                dataKey="revenue" 
                fill="url(#revenueGradient)"
                radius={[8, 8, 0, 0]}
              />
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(16, 185, 129)" />
                  <stop offset="100%" stopColor="rgb(5, 150, 105)" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Distribution */}
        <div className="pipe-card p-6 slide-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-400" />
            Inventory Distribution
          </h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="value"
                  stroke="none"
                >
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {inventoryData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">{item.category}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Trends */}
        <div className="pipe-card p-6 slide-up" style={{ animationDelay: '0.6s' }}>
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-400" />
            Order & Customer Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgb(148, 163, 184)" />
              <YAxis stroke="rgb(148, 163, 184)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke="rgb(139, 92, 246)" 
                strokeWidth={3}
                dot={{ fill: 'rgb(139, 92, 246)', strokeWidth: 2, r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="customers" 
                stroke="rgb(245, 158, 11)" 
                strokeWidth={3}
                dot={{ fill: 'rgb(245, 158, 11)', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="pipe-card p-6 scale-in">
          <h4 className="font-semibold text-lg mb-3 text-blue-400">Top Performing Product</h4>
          <p className="text-2xl font-bold mb-1">Steel Pipes 6"</p>
          <p className="text-muted-foreground">342 units sold this month</p>
        </div>
        
        <div className="pipe-card p-6 scale-in" style={{ animationDelay: '0.2s' }}>
          <h4 className="font-semibold text-lg mb-3 text-green-400">Conversion Rate</h4>
          <p className="text-2xl font-bold mb-1">24.8%</p>
          <p className="text-muted-foreground">+3.2% from last month</p>
        </div>
        
        <div className="pipe-card p-6 scale-in" style={{ animationDelay: '0.4s' }}>
          <h4 className="font-semibold text-lg mb-3 text-purple-400">Average Order Value</h4>
          <p className="text-2xl font-bold mb-1">$284.50</p>
          <p className="text-muted-foreground">+$12.30 from last month</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
