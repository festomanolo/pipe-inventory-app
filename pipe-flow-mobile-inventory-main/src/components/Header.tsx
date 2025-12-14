
import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const Header = () => {
  const [notificationCount] = useState(3);

  return (
    <header className="pipe-gradient-bg text-white p-4 sticky top-0 z-40 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold">Pipe Inventory</h1>
            <p className="text-sm opacity-90">Management System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
          >
            <Search className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/20 relative transition-all duration-300 transform hover:scale-105"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full h-5 w-5 flex items-center justify-center pulse-slow">
                {notificationCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
