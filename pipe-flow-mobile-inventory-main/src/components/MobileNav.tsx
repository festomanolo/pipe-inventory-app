import { 
  Database, 
  Clock, 
  User, 
  Settings,
  Book,
  List,
  BarChart3,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MobileNav = ({ activeTab, onTabChange }: MobileNavProps) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Database },
    { id: 'inventory', label: 'Inventory', icon: List },
    { id: 'sales', label: 'Sales', icon: Clock },
    { id: 'customers', label: 'Customers', icon: User },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: Book },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Find the index of the active tab
  const activeIndex = navItems.findIndex(item => item.id === activeTab);

  // Scroll to the active tab when it changes
  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        const scrollLeft = activeElement.offsetLeft - scrollRef.current.clientWidth / 2 + activeElement.clientWidth / 2;
        scrollRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [activeTab, activeIndex]);

  // Check if we need to show scroll arrows
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swipe left - go to next tab
      const currentIndex = navItems.findIndex(item => item.id === activeTab);
      if (currentIndex < navItems.length - 1) {
        onTabChange(navItems[currentIndex + 1].id);
      }
    }

    if (touchEnd - touchStart > 75) {
      // Swipe right - go to previous tab
      const currentIndex = navItems.findIndex(item => item.id === activeTab);
      if (currentIndex > 0) {
        onTabChange(navItems[currentIndex - 1].id);
      }
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -100, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 100, behavior: 'smooth' });
    }
  };

  return (
    <nav className="mobile-nav">
      <div className="relative">
        {showLeftArrow && (
          <button 
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 rounded-full p-1 shadow-md"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5 text-primary" />
          </button>
        )}
        
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto hide-scrollbar py-2 px-4"
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center gap-1 transition-all duration-300 min-w-[70px] mx-2 px-3 py-2 rounded-xl ${
                  isActive 
                    ? 'text-white bg-primary shadow-lg scale-110' 
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : ''}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-white' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>

        {showRightArrow && (
          <button 
            onClick={scrollRight}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 rounded-full p-1 shadow-md"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5 text-primary" />
          </button>
        )}
      </div>
    </nav>
  );
};

export default MobileNav;
