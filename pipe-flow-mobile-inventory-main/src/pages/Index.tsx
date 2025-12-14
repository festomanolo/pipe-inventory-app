
import { useState } from 'react';
import Dashboard from '@/components/Dashboard';
import Inventory from '@/components/Inventory';
import Sales from '@/components/Sales';
import Customers from '@/components/Customers';
import Analytics from '@/components/Analytics';
import Reports from '@/components/Reports';
import Settings from '@/components/Settings';
import MobileNav from '@/components/MobileNav';
import Header from '@/components/Header';
import ThemeToggle from '@/components/ThemeToggle';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <Inventory />;
      case 'sales':
        return <Sales />;
      case 'customers':
        return <Customers />;
      case 'analytics':
        return <Analytics />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 transition-colors duration-500">
      <ThemeToggle />
      <Header />
      <main className="px-4 py-6">
        {renderContent()}
      </main>
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
