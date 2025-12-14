import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// Define types for our inventory items
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  type: string;
  quantity: number;
  price: number;
  cost: number;
  supplier: string;
  lastUpdated: string;
  description?: string;
}

// Define types for sales
export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  date: string;
  customer: string;
  customerId?: string;
  items: SaleItem[];
  total: number;
  paymentMethod: string;
  status: string;
  notes?: string;
}

// Define types for customers
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  lastPurchase?: string;
  notes?: string;
}

// Database context type
interface DatabaseContextType {
  inventory: InventoryItem[];
  sales: Sale[];
  customers: Customer[];
  loadingStatus: {
    inventory: boolean;
    sales: boolean;
    customers: boolean;
  };
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<InventoryItem>;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => Promise<InventoryItem>;
  deleteInventoryItem: (id: string) => Promise<boolean>;
  addSale: (sale: Omit<Sale, 'id'>) => Promise<Sale>;
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<Customer>;
  refreshData: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

// Sample data for testing
const sampleInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'PVC Pipe 1/2"',
    category: 'Pipes',
    type: 'PVC Pipe',
    quantity: 50,
    price: 12.99,
    cost: 8.50,
    supplier: 'ABC Supplies',
    lastUpdated: new Date().toISOString(),
    description: 'Standard 1/2 inch PVC pipe, 10ft length'
  },
  {
    id: '2',
    name: 'Copper Pipe 3/4"',
    category: 'Pipes',
    type: 'Copper Pipe',
    quantity: 25,
    price: 24.99,
    cost: 18.75,
    supplier: 'Metal Suppliers Inc',
    lastUpdated: new Date().toISOString(),
    description: 'Premium copper pipe, 3/4 inch diameter'
  }
];

const sampleSales: Sale[] = [
  {
    id: '1',
    date: new Date().toISOString(),
    customer: 'John Doe',
    customerId: '1',
    items: [
      {
        productId: '1',
        productName: 'PVC Pipe 1/2"',
        quantity: 5,
        price: 12.99,
        total: 64.95
      }
    ],
    total: 64.95,
    paymentMethod: 'Cash',
    status: 'Completed'
  }
];

const sampleCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    phone: '555-123-4567',
    email: 'john@example.com',
    address: '123 Main St',
    totalPurchases: 64.95,
    lastPurchase: new Date().toISOString()
  }
];

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingStatus, setLoadingStatus] = useState({
    inventory: true,
    sales: true,
    customers: true
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      // In a real app, this would load from a local database or API
      // For now, we'll use the sample data with a slight delay to simulate loading
      setTimeout(() => {
        setInventory(sampleInventory);
        setLoadingStatus(prev => ({ ...prev, inventory: false }));
      }, 500);
      
      setTimeout(() => {
        setSales(sampleSales);
        setLoadingStatus(prev => ({ ...prev, sales: false }));
      }, 700);
      
      setTimeout(() => {
        setCustomers(sampleCustomers);
        setLoadingStatus(prev => ({ ...prev, customers: false }));
      }, 900);
    };
    
    loadData();
  }, []);

  // Add a new inventory item
  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
      lastUpdated: new Date().toISOString()
    };
    
    setInventory(prev => [...prev, newItem]);
    return newItem;
  };

  // Update an inventory item
  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> => {
    const updatedInventory = inventory.map(item => 
      item.id === id ? { 
        ...item, 
        ...updates, 
        lastUpdated: new Date().toISOString() 
      } : item
    );
    
    setInventory(updatedInventory);
    const updatedItem = updatedInventory.find(item => item.id === id);
    
    if (!updatedItem) {
      throw new Error('Item not found');
    }
    
    return updatedItem;
  };

  // Delete an inventory item
  const deleteInventoryItem = async (id: string): Promise<boolean> => {
    setInventory(prev => prev.filter(item => item.id !== id));
    return true;
  };

  // Add a new sale
  const addSale = async (sale: Omit<Sale, 'id'>): Promise<Sale> => {
    const newSale = {
      ...sale,
      id: Date.now().toString()
    };
    
    setSales(prev => [...prev, newSale]);
    
    // Update inventory quantities
    for (const item of sale.items) {
      const inventoryItem = inventory.find(i => i.id === item.productId);
      if (inventoryItem) {
        await updateInventoryItem(item.productId, {
          quantity: inventoryItem.quantity - item.quantity
        });
      }
    }
    
    return newSale;
  };

  // Add a new customer
  const addCustomer = async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
    const newCustomer = {
      ...customer,
      id: Date.now().toString()
    };
    
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  // Update a customer
  const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<Customer> => {
    const updatedCustomers = customers.map(customer => 
      customer.id === id ? { ...customer, ...updates } : customer
    );
    
    setCustomers(updatedCustomers);
    const updatedCustomer = updatedCustomers.find(customer => customer.id === id);
    
    if (!updatedCustomer) {
      throw new Error('Customer not found');
    }
    
    return updatedCustomer;
  };

  // Refresh all data
  const refreshData = async (): Promise<void> => {
    setLoadingStatus({
      inventory: true,
      sales: true,
      customers: true
    });
    
    // In a real app, this would re-fetch from the database
    // For now, we'll just simulate a refresh with the sample data
    setTimeout(() => {
      setInventory(sampleInventory);
      setLoadingStatus(prev => ({ ...prev, inventory: false }));
    }, 500);
    
    setTimeout(() => {
      setSales(sampleSales);
      setLoadingStatus(prev => ({ ...prev, sales: false }));
    }, 700);
    
    setTimeout(() => {
      setCustomers(sampleCustomers);
      setLoadingStatus(prev => ({ ...prev, customers: false }));
    }, 900);
  };

  return (
    <DatabaseContext.Provider value={{
      inventory,
      sales,
      customers,
      loadingStatus,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      addSale,
      addCustomer,
      updateCustomer,
      refreshData
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
} 