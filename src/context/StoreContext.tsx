import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Category,
  Product,
  Sale,
  SaleItem,
  StockLog,
  CartItem,
  StoreSettings,
  PaymentMethod,
  PaymentStatus,
  Store,
  Customer,
  CustomerTier,
  User,
  UserRole,
  TabType,
  CashExpense,
  CashShift,
  DailyCashSummary,
  DigitalCategory,
  DigitalProduct,
  DigitalTransaction,
  DigitalInquiryData,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_SETTINGS,
  INITIAL_STORES,
  INITIAL_CUSTOMERS,
  INITIAL_USERS,
  INITIAL_CASH_SHIFTS,
  INITIAL_CASH_EXPENSES,
} from '../data/initialData';
import {
  INITIAL_DIGITAL_PRODUCTS,
  INITIAL_DIGITAL_TRANSACTIONS,
  INITIAL_DEPOSIT_BALANCE,
} from '../data/initialDigitalData';
import { generateInvoiceNumber, formatRupiah } from '../utils/formatters';
import {
  DEFAULT_PPOB_SETTINGS,
  executePPOBTransaction,
  fetchPPOBServerBalance,
  fetchDigiFlazzPriceList,
} from '../services/ppobService';

interface CheckoutPayload {
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentGatewayRef?: string;
  storeId?: string;
  customerId?: string;
  customerName?: string;
  cashierName?: string;
  cashierId?: string;
  discount: number;
  pointsRedeemed?: number;
  pointsDiscount?: number;
  paidAmount: number;
  notes?: string;
}

interface StoreContextType {
  // Authentication & RBAC
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  hasRole: (roles: UserRole[]) => boolean;
  canAccessTab: (tab: string) => boolean;

  // Navigation & Session
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  activeCashier: string;
  setActiveCashier: (name: string) => void;
  settings: StoreSettings;
  setSettings: (settings: StoreSettings | ((prev: StoreSettings) => StoreSettings)) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Cash Drawer & Shift Management (Modal Awal, Pengeluaran, Kas Laci)
  cashShifts: CashShift[];
  cashExpenses: CashExpense[];
  currentShift: CashShift | null;
  openShift: (openingFloat: number, notes?: string) => CashShift;
  updateOpeningFloat: (shiftId: string, newFloat: number) => void;
  closeShift: (shiftId: string, actualCash: number, notes?: string) => CashShift;
  addExpense: (expense: Omit<CashExpense, 'id' | 'date'>) => CashExpense;
  updateExpense: (id: string, updates: Partial<CashExpense>) => void;
  deleteExpense: (id: string) => void;
  getDailyCashSummary: (dateStr?: string, storeId?: string) => DailyCashSummary;

  // Multi-Store Branches
  stores: Store[];
  activeStoreId: string;
  activeStore: Store;
  selectedStoreFilter: string | 'all';
  setActiveStoreId: (storeId: string) => void;
  setSelectedStoreFilter: (storeId: string | 'all') => void;
  addStore: (store: Omit<Store, 'id' | 'createdAt'>) => Store;
  updateStore: (id: string, updates: Partial<Store>) => void;
  deleteStore: (id: string) => void;
  transferProductStock: (
    sourceProductId: string,
    targetStoreId: string,
    quantity: number,
    note?: string
  ) => boolean;

  // Customers & Loyalty
  customers: Customer[];
  addCustomer: (
    data: Omit<Customer, 'id' | 'points' | 'tier' | 'totalSpent' | 'totalOrders' | 'createdAt'> & {
      initialPoints?: number;
    }
  ) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  adjustCustomerPoints: (customerId: string, pointDiff: number, reason?: string) => void;

  // Inventory & Categories
  products: Product[];
  categories: Category[];
  lowStockProducts: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  restockProduct: (id: string, additionalStock: number, note?: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Sales & Stock Logs
  sales: Sale[];
  stockLogs: StockLog[];
  processCheckout: (payload: CheckoutPayload) => Sale;
  refundSale: (saleId: string, reason?: string) => void;
  settleDebtSale: (saleId: string, paidAmount: number, paymentMethod?: PaymentMethod, note?: string) => Sale | null;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => boolean;
  updateCartQty: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  loadCart: (items: CartItem[]) => void;
  cartTotals: {
    subtotal: number;
    itemCount: number;
    totalUnits: number;
  };

  // Digital Products & PPOB
  digitalProducts: DigitalProduct[];
  digitalTransactions: DigitalTransaction[];
  digitalDepositBalance: number;
  topUpDepositBalance: (amount: number, note?: string) => void;
  syncPPOBServerBalance: () => Promise<number>;
  syncProductsFromDigiFlazz: () => Promise<{ count: number; error?: string }>;
  processDigitalTransaction: (payload: {
    productId: string;
    targetNumber: string;
    customerName?: string;
    paymentMethod: PaymentMethod;
    customSellingPrice?: number;
    inquiryData?: DigitalInquiryData;
    manualSN?: string;
    forceManualFallback?: boolean;
    notes?: string;
  }) => Promise<DigitalTransaction>;
  updateDigitalProductPrice: (productId: string, newSellingPrice: number) => void;

  // Database Utilities
  resetToDefault: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonString: string) => boolean;

  // Cloud & Multi-Device Sync
  isCloudSynced: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncWithServer: () => Promise<boolean>;
  pushToServer: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEYS = {
  USERS: 'pos_users_v3',
  CURRENT_USER: 'pos_current_user_v3',
  STORES: 'pos_stores_v2',
  ACTIVE_STORE: 'pos_active_store_v2',
  CUSTOMERS: 'pos_customers_v2',
  PRODUCTS: 'pos_products_v2',
  CATEGORIES: 'pos_categories_v2',
  SALES: 'pos_sales_v2',
  STOCK_LOGS: 'pos_stock_logs_v2',
  SETTINGS: 'pos_settings_v3',
  CASHIER: 'pos_active_cashier_v2',
  CASH_SHIFTS: 'pos_cash_shifts_v2',
  CASH_EXPENSES: 'pos_cash_expenses_v2',
  DIGITAL_PRODUCTS: 'pos_digital_products_v12_real_digiflazz',
  DIGITAL_TRANSACTIONS: 'pos_digital_transactions_v2',
  DIGITAL_DEPOSIT: 'pos_digital_deposit_v2',
};

function calculateCustomerTier(totalSpent: number): CustomerTier {
  if (totalSpent >= 5000000) return 'Platinum';
  if (totalSpent >= 2500000) return 'Gold';
  if (totalSpent >= 1000000) return 'Silver';
  return 'Bronze';
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<TabType>(() => {
    try {
      const saved = sessionStorage.getItem('pos_active_tab') as TabType;
      return saved || 'pos';
    } catch {
      return 'pos';
    }
  });

  const setActiveTab = useCallback((tab: TabType) => {
    setActiveTabState(tab);
    try {
      sessionStorage.setItem('pos_active_tab', tab);
    } catch (e) {
      // Ignore
    }
  }, []);

  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string | 'all'>('all');

  // Users & Auth State
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      return stored ? JSON.parse(stored) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeCashier, setActiveCashierState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CASHIER) || 'Budi Santoso';
  });

  const [stores, setStores] = useState<Store[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STORES);
      return stored ? JSON.parse(stored) : INITIAL_STORES;
    } catch {
      return INITIAL_STORES;
    }
  });

  const [activeStoreId, setActiveStoreIdState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_STORE);
      return stored || (stores[0]?.id || 'store-1');
    } catch {
      return 'store-1';
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return stored ? JSON.parse(stored) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [settings, setSettingsState] = useState<StoreSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          gateways: {
            ...INITIAL_SETTINGS.gateways,
            ...(parsed.gateways || {}),
          },
          printer: {
            ...INITIAL_SETTINGS.printer,
            ...(parsed.printer || {}),
          },
          whatsapp: {
            ...INITIAL_SETTINGS.whatsapp,
            ...(parsed.whatsapp || {}),
          },
          audioNotification: {
            ...INITIAL_SETTINGS.audioNotification,
            ...(parsed.audioNotification || {}),
          },
        };
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem('averion_pos_theme');
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('averion_pos_theme', newTheme);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // ignore
    }
  }, [theme]);

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (stored) {
        const parsed: Category[] = JSON.parse(stored);
        const existingIds = new Set(parsed.map((c) => c.id));
        const missing = INITIAL_CATEGORIES.filter((c) => !existingIds.has(c.id));
        return [...parsed, ...missing];
      }
      return INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (stored) {
        const parsed: Product[] = JSON.parse(stored);
        const existingIds = new Set(parsed.map((p) => p.id));
        const missing = INITIAL_PRODUCTS.filter((p) => !existingIds.has(p.id));
        return [...parsed, ...missing];
      }
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SALES);
      return stored ? JSON.parse(stored) : INITIAL_SALES;
    } catch {
      return INITIAL_SALES;
    }
  });

  const [stockLogs, setStockLogs] = useState<StockLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STOCK_LOGS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Cash Shifts (Modal Kasir & Buka/Tutup Shift)
  const [cashShifts, setCashShifts] = useState<CashShift[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CASH_SHIFTS);
      return stored ? JSON.parse(stored) : INITIAL_CASH_SHIFTS;
    } catch {
      return INITIAL_CASH_SHIFTS;
    }
  });

  // Cash Expenses (Pengeluaran Operasional / Kas Keluar Harian)
  const [cashExpenses, setCashExpenses] = useState<CashExpense[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CASH_EXPENSES);
      return stored ? JSON.parse(stored) : INITIAL_CASH_EXPENSES;
    } catch {
      return INITIAL_CASH_EXPENSES;
    }
  });

  // Digital Products & PPOB State
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>(() => {
    try {
      // Clean legacy cache keys
      ['pos_digital_products', 'pos_digital_products_v2', 'pos_digital_products_v3', 'pos_digital_products_v4', 'pos_digital_products_v5', 'pos_digital_products_v6_digiflazz', 'pos_digital_products_v7_postpaid', 'pos_digital_products_v8_pasca_clean', 'pos_digital_products_v9_sp01', 'pos_digital_products_v10_game_clean', 'pos_digital_products_v11_game_fixed'].forEach((k) => {
        try { localStorage.removeItem(k); } catch {}
      });
      const stored = localStorage.getItem(STORAGE_KEYS.DIGITAL_PRODUCTS);
      if (stored) {
        const parsed: DigitalProduct[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cellular = ['Telkomsel', 'Indosat Ooredoo', 'XL Axiata', 'Axis', 'Tri (3)', 'Smartfren'];
          const filtered = parsed
            .filter((p) => !p.id.startsWith('post-') && !['post-pln', 'post-bpjs', 'post-pdam', 'post-halo', 'post-fif', 'post-pgn'].includes(p.id))
            .map((p) => {
              if (p.category === 'postpaid' && p.name.toLowerCase().includes('pertagas')) {
                return { ...p, category: 'pln' };
              }
              if (p.category === 'game' && cellular.includes(p.provider)) {
                return { ...p, category: 'data' };
              }
              return p;
            });
          if (filtered.length > 0) return filtered;
        }
      }
      localStorage.setItem(STORAGE_KEYS.DIGITAL_PRODUCTS, JSON.stringify(INITIAL_DIGITAL_PRODUCTS));
      return INITIAL_DIGITAL_PRODUCTS;
    } catch {
      return INITIAL_DIGITAL_PRODUCTS;
    }
  });

  const [digitalTransactions, setDigitalTransactions] = useState<DigitalTransaction[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DIGITAL_TRANSACTIONS);
      return stored ? JSON.parse(stored) : INITIAL_DIGITAL_TRANSACTIONS;
    } catch {
      return INITIAL_DIGITAL_TRANSACTIONS;
    }
  });

  const [digitalDepositBalance, setDigitalDepositBalance] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DIGITAL_DEPOSIT);
      return stored ? JSON.parse(stored) : INITIAL_DEPOSIT_BALANCE;
    } catch {
      return INITIAL_DEPOSIT_BALANCE;
    }
  });

  const [cart, setCart] = useState<CartItem[]>([]);

  // Multi-Device Cloud Sync State
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const isInitialSyncAttempted = useRef(false);

  // Sync pull from server
  const pullFromServer = useCallback(async (): Promise<boolean> => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/pos/data');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.hasData && json.data) {
        const data = json.data;
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories((prev) => {
            const map = new Map<string, Category>();
            data.categories.forEach((c: Category) => {
              if (c && c.id) map.set(c.id, c);
            });
            prev.forEach((c: Category) => {
              if (c && c.id && !map.has(c.id)) map.set(c.id, c);
            });
            return Array.from(map.values());
          });
        }
        if (Array.isArray(data.stores) && data.stores.length > 0) {
          setStores((prev) => {
            const map = new Map<string, Store>();
            data.stores.forEach((s: Store) => {
              if (s && s.id) map.set(s.id, s);
            });
            prev.forEach((s: Store) => {
              if (s && s.id && !map.has(s.id)) map.set(s.id, s);
            });
            return Array.from(map.values());
          });
        }
        if (Array.isArray(data.sales)) {
          setSales((prev) => {
            const map = new Map<string, Sale>();
            data.sales.forEach((s: Sale) => {
              if (s && s.id) map.set(s.id, s);
            });
            prev.forEach((s: Sale) => {
              if (s && s.id && !map.has(s.id)) map.set(s.id, s);
            });
            return Array.from(map.values());
          });
        }
        if (Array.isArray(data.customers)) {
          setCustomers((prev) => {
            const map = new Map<string, Customer>();
            data.customers.forEach((c: Customer) => {
              if (c && c.id) map.set(c.id, c);
            });
            prev.forEach((c: Customer) => {
              if (c && c.id && !map.has(c.id)) map.set(c.id, c);
            });
            return Array.from(map.values());
          });
        }
        if (Array.isArray(data.stockLogs)) {
          setStockLogs((prev) => {
            const map = new Map<string, StockLog>();
            data.stockLogs.forEach((l: StockLog) => {
              if (l && l.id) map.set(l.id, l);
            });
            prev.forEach((l: StockLog) => {
              if (l && l.id && !map.has(l.id)) map.set(l.id, l);
            });
            return Array.from(map.values());
          });
        }
        if (Array.isArray(data.cashShifts)) {
          setCashShifts(data.cashShifts);
        }
        if (Array.isArray(data.cashExpenses)) {
          setCashExpenses(data.cashExpenses);
        }
        if (data.settings) {
          setSettingsState((prev) => ({ ...prev, ...data.settings }));
        }
        setIsCloudSynced(true);
        setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
        return true;
      } else if (json.success && !json.hasData) {
        // Server database is empty, push current local data to populate
        pushToServer();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Sync from server status:', err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Sync push to server
  const pushToServer = useCallback(async (): Promise<void> => {
    try {
      const payload = {
        products,
        categories,
        stores,
        sales,
        customers,
        stockLogs,
        settings,
        cashShifts,
        cashExpenses,
        users,
      };
      const res = await fetch('/api/pos/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsCloudSynced(true);
        setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
      }
    } catch (err) {
      console.warn('Failed pushing sync to server:', err);
    }
  }, [products, categories, stores, sales, customers, stockLogs, settings, cashShifts, cashExpenses, users]);

  // Initial pull and periodic sync for multi-device live reflection
  useEffect(() => {
    if (!isInitialSyncAttempted.current) {
      isInitialSyncAttempted.current = true;
      pullFromServer();
    }

    const handleFocus = () => {
      pullFromServer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pullFromServer();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic check every 3 seconds for instant real-time PC-to-HP sync
    const syncInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        pullFromServer();
      }
    }, 3000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(syncInterval);
    };
  }, [pullFromServer]);

  // Auto-sync active DigiFlazz products on startup
  const isPPOBSyncAttempted = useRef(false);
  useEffect(() => {
    if (!isPPOBSyncAttempted.current) {
      isPPOBSyncAttempted.current = true;
      const config = settings.ppobGateway || DEFAULT_PPOB_SETTINGS;
      if (config.username && config.apiKey) {
        syncProductsFromDigiFlazz().catch(() => {});
      }
    }
  }, []);

  // Debounced push to server whenever state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      pushToServer();
    }, 1200);
    return () => clearTimeout(timer);
  }, [products, categories, stores, sales, customers, stockLogs, settings, cashShifts, cashExpenses]);

  // Sync to local storage for offline resilience
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_STORE, activeStoreId);
  }, [activeStoreId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_LOGS, JSON.stringify(stockLogs));
  }, [stockLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASH_SHIFTS, JSON.stringify(cashShifts));
  }, [cashShifts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASH_EXPENSES, JSON.stringify(cashExpenses));
  }, [cashExpenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DIGITAL_PRODUCTS, JSON.stringify(digitalProducts));
  }, [digitalProducts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DIGITAL_TRANSACTIONS, JSON.stringify(digitalTransactions));
  }, [digitalTransactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DIGITAL_DEPOSIT, JSON.stringify(digitalDepositBalance));
  }, [digitalDepositBalance]);

  // Auth Methods
  const login = async (
    identifier: string,
    password?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const clean = identifier.trim().toLowerCase();
    const user = users.find(
      (u) =>
        u.active &&
        (u.username.toLowerCase() === clean || u.email.toLowerCase() === clean)
    );

    if (!user) {
      return { success: false, message: 'Nama pengguna atau email tidak ditemukan / nonaktif.' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, message: 'Kata sandi tidak sesuai. Silakan coba lagi.' };
    }

    const updatedUser = {
      ...user,
      lastLogin: new Date().toISOString(),
    };

    setCurrentUser(updatedUser);
    setActiveCashierState(user.name);
    localStorage.setItem(STORAGE_KEYS.CASHIER, user.name);

    if (user.storeId && stores.some((s) => s.id === user.storeId)) {
      setActiveStoreIdState(user.storeId);
    }

    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setCart([]);
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId && u.active);
    if (target) {
      setCurrentUser(target);
      setActiveCashierState(target.name);
      localStorage.setItem(STORAGE_KEYS.CASHIER, target.name);
      if (target.storeId && stores.some((s) => s.id === target.storeId)) {
        setActiveStoreIdState(target.storeId);
      }
    }
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      active: userData.active !== undefined ? userData.active : true,
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (currentUser?.id === id) {
            setCurrentUser(updated);
            if (updates.name) {
              setActiveCashierState(updates.name);
              localStorage.setItem(STORAGE_KEYS.CASHIER, updates.name);
            }
          }
          return updated;
        }
        return u;
      })
    );
  };

  const deleteUser = (id: string) => {
    if (users.length <= 1) {
      alert('Tidak dapat menghapus satu-satunya user yang tersisa.');
      return;
    }
    if (currentUser?.id === id) {
      alert('Tidak dapat menghapus user yang sedang aktif login.');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
  };

  const canAccessTab = (tab: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'admin') {
      return ['dashboard', 'pos', 'digital-products', 'inventory', 'customers', 'history', 'reports', 'cash-drawer', 'settings'].includes(tab);
    }
    if (currentUser.role === 'kasir') {
      return ['dashboard', 'pos', 'digital-products', 'customers', 'history', 'cash-drawer'].includes(tab);
    }
    return false;
  };

  const setActiveCashier = (name: string) => {
    setActiveCashierState(name);
    localStorage.setItem(STORAGE_KEYS.CASHIER, name);
  };

  const setSettings = (newSettingsOrUpdater: StoreSettings | ((prev: StoreSettings) => StoreSettings)) => {
    setSettingsState(newSettingsOrUpdater);
  };

  const setActiveStoreId = (storeId: string) => {
    setActiveStoreIdState(storeId);
    // Clear cart when changing store to avoid stock cross-branch mismatch
    setCart([]);
  };

  // Active Store object
  const activeStore = useMemo(() => {
    return (
      stores.find((s) => s.id === activeStoreId) ||
      stores[0] || {
        id: 'store-1',
        code: 'PST-01',
        name: settings.name,
        address: settings.address,
        phone: settings.phone,
        isMain: true,
      }
    );
  }, [stores, activeStoreId, settings]);

  // Low stock products for currently active store
  const lowStockProducts = useMemo(() => {
    return products.filter(
      (p) => p.storeId === activeStoreId && p.stock <= (p.minStockAlert || 10)
    );
  }, [products, activeStoreId]);

  // Store Management
  const addStore = (storeData: Omit<Store, 'id' | 'createdAt'>): Store => {
    const newStore: Store = {
      ...storeData,
      id: `store-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setStores((prev) => [...prev, newStore]);
    return newStore;
  };

  const updateStore = (id: string, updates: Partial<Store>) => {
    setStores((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const deleteStore = (id: string) => {
    if (stores.length <= 1) {
      alert('Tidak dapat menghapus satu-satunya toko yang terdaftar.');
      return;
    }
    setStores((prev) => prev.filter((s) => s.id !== id));
    if (activeStoreId === id) {
      const remaining = stores.filter((s) => s.id !== id);
      if (remaining[0]) {
        setActiveStoreId(remaining[0].id);
      }
    }
  };

  // Transfer stock between stores
  const transferProductStock = (
    sourceProductId: string,
    targetStoreId: string,
    quantity: number,
    note?: string
  ): boolean => {
    const sourceProd = products.find((p) => p.id === sourceProductId);
    if (!sourceProd || sourceProd.stock < quantity || quantity <= 0) return false;

    const sourceStore = stores.find((s) => s.id === sourceProd.storeId);
    const targetStore = stores.find((s) => s.id === targetStoreId);
    const now = new Date().toISOString();

    const targetProd = products.find(
      (p) => p.storeId === targetStoreId && p.sku === sourceProd.sku
    );

    const newLogs: StockLog[] = [];
    const newSourceStock = sourceProd.stock - quantity;
    newLogs.push({
      id: `log-trf-out-${Date.now()}`,
      storeId: sourceProd.storeId,
      productId: sourceProd.id,
      productName: sourceProd.name,
      sku: sourceProd.sku,
      type: 'transfer',
      quantityChange: -quantity,
      previousStock: sourceProd.stock,
      newStock: newSourceStock,
      date: now,
      note: `Transfer keluar ke ${targetStore?.name || targetStoreId}: ${note || ''}`,
    });

    if (targetProd) {
      const newTargetStock = targetProd.stock + quantity;
      newLogs.push({
        id: `log-trf-in-${Date.now()}`,
        storeId: targetStoreId,
        productId: targetProd.id,
        productName: targetProd.name,
        sku: targetProd.sku,
        type: 'transfer',
        quantityChange: quantity,
        previousStock: targetProd.stock,
        newStock: newTargetStock,
        date: now,
        note: `Transfer masuk dari ${sourceStore?.name || sourceProd.storeId}: ${note || ''}`,
      });

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === sourceProd.id) {
            return { ...p, stock: newSourceStock, updatedAt: now };
          }
          if (p.id === targetProd.id) {
            return { ...p, stock: newTargetStock, updatedAt: now };
          }
          return p;
        })
      );
    } else {
      const newTargetProd: Product = {
        ...sourceProd,
        id: `prod-${Date.now()}`,
        storeId: targetStoreId,
        stock: quantity,
        createdAt: now,
        updatedAt: now,
      };

      newLogs.push({
        id: `log-trf-in-${Date.now()}`,
        storeId: targetStoreId,
        productId: newTargetProd.id,
        productName: newTargetProd.name,
        sku: newTargetProd.sku,
        type: 'transfer',
        quantityChange: quantity,
        previousStock: 0,
        newStock: quantity,
        date: now,
        note: `Transfer masuk dari ${sourceStore?.name || sourceProd.storeId}: ${note || ''}`,
      });

      setProducts((prev) => [
        ...prev.map((p) => (p.id === sourceProd.id ? { ...p, stock: newSourceStock, updatedAt: now } : p)),
        newTargetProd,
      ]);
    }

    setStockLogs((prev) => [...newLogs, ...prev]);
    return true;
  };

  // Customer Management
  const addCustomer = (
    data: Omit<Customer, 'id' | 'points' | 'tier' | 'totalSpent' | 'totalOrders' | 'createdAt'> & {
      initialPoints?: number;
    }
  ): Customer => {
    const points = data.initialPoints || 0;
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      notes: data.notes,
      points,
      tier: 'Bronze',
      totalSpent: 0,
      totalOrders: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          if (updates.totalSpent !== undefined) {
            updated.tier = calculateCustomerTier(updated.totalSpent);
          }
          return updated;
        }
        return c;
      })
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const adjustCustomerPoints = (customerId: string, pointDiff: number, reason?: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const newPoints = Math.max(0, c.points + pointDiff);
          return {
            ...c,
            points: newPoints,
            notes: reason ? `${c.notes ? c.notes + ' | ' : ''}Penyesuaian poin: ${pointDiff > 0 ? '+' : ''}${pointDiff} (${reason})` : c.notes,
          };
        }
        return c;
      })
    );
  };

  // Cart Calculations
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const itemCount = cart.length;
    const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, itemCount, totalUnits };
  }, [cart]);

  const addToCart = (product: Product, quantity = 1): boolean => {
    const currentCartItem = cart.find((item) => item.product.id === product.id);
    const currentQtyInCart = currentCartItem ? currentCartItem.quantity : 0;
    const requestedQty = currentQtyInCart + quantity;

    if (requestedQty > product.stock) {
      return false; // Insufficient stock
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    return true;
  };

  const updateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product || quantity > product.stock) {
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const loadCart = (items: CartItem[]) => {
    setCart(items);
  };

  // Checkout with Multi-Store & Loyalty Points Integration
  const processCheckout = (payload: CheckoutPayload): Sale => {
    const now = new Date().toISOString();
    const invoiceNumber = generateInvoiceNumber();
    const subtotal = cartTotals.subtotal;
    const directDiscount = Math.max(0, payload.discount || 0);
    const pointsDiscount = Math.max(0, payload.pointsDiscount || 0);
    const totalDiscount = directDiscount + pointsDiscount;
    const taxableAmount = Math.max(0, subtotal - totalDiscount);
    const tax = settings.enableTax ? Math.round(taxableAmount * (settings.taxRate / 100)) : 0;
    const totalAmount = Math.max(0, taxableAmount + tax);
    const paidAmount = payload.paidAmount || totalAmount;
    const changeAmount = Math.max(0, paidAmount - totalAmount);

    const storeForSale = payload.storeId || activeStoreId;

    const pointsRewardRatio = settings.pointsRewardRatio || 10000;
    const pointsEarned = payload.customerId
      ? Math.floor(totalAmount / pointsRewardRatio)
      : 0;

    const saleId = `sale-${Date.now()}`;
    const saleItems: SaleItem[] = cart.map((item, index) => ({
      id: `si-${Date.now()}-${index}`,
      saleId,
      productId: item.product.id,
      productName: item.product.name,
      sku: item.product.sku,
      price: item.product.price,
      costPrice: item.product.costPrice,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    }));

    const newSale: Sale = {
      id: saleId,
      storeId: storeForSale,
      invoiceNumber,
      date: now,
      cashierName: payload.cashierName || currentUser?.name || activeCashier,
      cashierId: payload.cashierId || currentUser?.id,
      customerId: payload.customerId,
      customerName: payload.customerName?.trim() || 'Pelanggan Umum',
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentStatus || 'completed',
      paymentGatewayRef: payload.paymentGatewayRef,
      subtotal,
      discount: directDiscount,
      pointsDiscount,
      pointsEarned,
      pointsRedeemed: payload.pointsRedeemed || 0,
      tax,
      totalAmount,
      paidAmount,
      changeAmount,
      items: saleItems,
      notes: payload.notes,
      status: 'completed',
    };

    // Update product stock
    const newStockLogs: StockLog[] = [];
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const cartItem = cart.find((item) => item.product.id === p.id);
        if (cartItem) {
          const newStock = Math.max(0, p.stock - cartItem.quantity);
          newStockLogs.push({
            id: `log-${Date.now()}-${p.id}`,
            storeId: p.storeId || storeForSale,
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            type: 'sale',
            quantityChange: -cartItem.quantity,
            previousStock: p.stock,
            newStock,
            date: now,
            note: `Penjualan ${invoiceNumber} (${activeStore.name})`,
          });
          return {
            ...p,
            stock: newStock,
            updatedAt: now,
          };
        }
        return p;
      })
    );

    if (newStockLogs.length > 0) {
      setStockLogs((prev) => [...newStockLogs, ...prev]);
    }

    if (payload.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === payload.customerId) {
            const redeemed = payload.pointsRedeemed || 0;
            const newPointBalance = Math.max(0, c.points - redeemed + pointsEarned);
            const newTotalSpent = c.totalSpent + totalAmount;
            const newTotalOrders = c.totalOrders + 1;
            return {
              ...c,
              points: newPointBalance,
              totalSpent: newTotalSpent,
              totalOrders: newTotalOrders,
              tier: calculateCustomerTier(newTotalSpent),
            };
          }
          return c;
        })
      );
    }

    setSales((prev) => [newSale, ...prev]);
    clearCart();

    return newSale;
  };

  const refundSale = (saleId: string, reason?: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale || sale.status === 'refunded') return;

    const now = new Date().toISOString();
    const returnLogs: StockLog[] = [];

    setProducts((prev) =>
      prev.map((p) => {
        const saleItem = sale.items.find((si) => si.productId === p.id);
        if (saleItem) {
          const newStock = p.stock + saleItem.quantity;
          returnLogs.push({
            id: `log-ref-${Date.now()}-${p.id}`,
            storeId: p.storeId || sale.storeId,
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            type: 'adjustment',
            quantityChange: saleItem.quantity,
            previousStock: p.stock,
            newStock,
            date: now,
            note: `Retur/Batal ${sale.invoiceNumber}: ${reason || 'Pembatalan transaksi'}`,
          });
          return { ...p, stock: newStock, updatedAt: now };
        }
        return p;
      })
    );

    if (returnLogs.length > 0) {
      setStockLogs((prev) => [...returnLogs, ...prev]);
    }

    if (sale.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === sale.customerId) {
            const returnedSpent = Math.max(0, c.totalSpent - sale.totalAmount);
            const returnedPoints = Math.max(0, c.points - (sale.pointsEarned || 0) + (sale.pointsRedeemed || 0));
            return {
              ...c,
              totalSpent: returnedSpent,
              totalOrders: Math.max(0, c.totalOrders - 1),
              points: returnedPoints,
              tier: calculateCustomerTier(returnedSpent),
            };
          }
          return c;
        })
      );
    }

    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, status: 'refunded' } : s))
    );
  };

  const settleDebtSale = (
    saleId: string,
    paidAmount: number,
    paymentMethod: PaymentMethod = 'cash',
    note?: string
  ): Sale | null => {
    let updatedSale: Sale | null = null;
    const now = new Date().toISOString();

    setSales((prev) =>
      prev.map((s) => {
        if (s.id === saleId) {
          const currentPaid = s.paidAmount || 0;
          const newPaid = Math.min(s.totalAmount, currentPaid + paidAmount);
          const newDebtRemaining = Math.max(0, s.totalAmount - newPaid);
          const isFullyPaid = newDebtRemaining <= 0;

          updatedSale = {
            ...s,
            paidAmount: newPaid,
            debtRemaining: newDebtRemaining,
            paymentStatus: isFullyPaid ? 'completed' : 'partial',
            paymentMethod: isFullyPaid ? paymentMethod : s.paymentMethod,
            paidOffDate: isFullyPaid ? now : s.paidOffDate,
            notes: note
              ? s.notes
                ? `${s.notes} | Pelunasan ${formatRupiah(paidAmount)}: ${note}`
                : `Pelunasan ${formatRupiah(paidAmount)}: ${note}`
              : s.notes,
          };
          return updatedSale;
        }
        return s;
      })
    );

    return updatedSale;
  };

  // Product Operations
  const addProduct = (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): Product => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      storeId: productData.storeId || activeStoreId,
      id: `prod-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Immediately persist to server & Turso cloud
    fetch('/api/pos/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    })
      .then(() => setTimeout(() => pushToServer(), 300))
      .catch((err) => console.warn('Product immediate server sync error:', err));

    if (newProduct.stock > 0) {
      const initialLog: StockLog = {
        id: `log-init-${Date.now()}`,
        storeId: newProduct.storeId,
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        type: 'initial',
        quantityChange: newProduct.stock,
        previousStock: 0,
        newStock: newProduct.stock,
        date: now,
        note: 'Stok awal produk baru',
      };
      setStockLogs((prev) => [initialLog, ...prev]);
    }

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const now = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          if (updates.stock !== undefined && updates.stock !== p.stock) {
            const diff = updates.stock - p.stock;
            const log: StockLog = {
              id: `log-adj-${Date.now()}`,
              storeId: p.storeId,
              productId: p.id,
              productName: updates.name || p.name,
              sku: updates.sku || p.sku,
              type: 'adjustment',
              quantityChange: diff,
              previousStock: p.stock,
              newStock: updates.stock,
              date: now,
              note: 'Penyesuaian stok manual',
            };
            setStockLogs((l) => [log, ...l]);
          }
          return { ...p, ...updates, updatedAt: now };
        }
        return p;
      })
    );

    // Immediately persist to server & Turso cloud
    fetch(`/api/pos/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
      .then(() => setTimeout(() => pushToServer(), 300))
      .catch((err) => console.warn('Product update server sync error:', err));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    removeFromCart(id);

    // Immediately persist to server & Turso cloud
    fetch(`/api/pos/products/${id}`, {
      method: 'DELETE',
    })
      .then(() => setTimeout(() => pushToServer(), 300))
      .catch((err) => console.warn('Product delete server sync error:', err));
  };

  const restockProduct = (id: string, additionalStock: number, note = 'Restock barang') => {
    if (additionalStock <= 0) return;
    const now = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newStock = p.stock + additionalStock;
          const log: StockLog = {
            id: `log-restock-${Date.now()}`,
            storeId: p.storeId,
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            type: 'restock',
            quantityChange: additionalStock,
            previousStock: p.stock,
            newStock,
            date: now,
            note: `${note} (+${additionalStock})`,
          };
          setStockLogs((l) => [log, ...l]);
          return { ...p, stock: newStock, updatedAt: now };
        }
        return p;
      })
    );
  };

  // Category Operations
  const addCategory = (categoryData: Omit<Category, 'id'>): Category => {
    const newCategory: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Cash Drawer & Shift Operations
  const currentShift = useMemo(() => {
    return (
      cashShifts.find(
        (s) => s.storeId === activeStoreId && s.status === 'open'
      ) || null
    );
  }, [cashShifts, activeStoreId]);

  const openShift = (openingFloat: number, notes?: string): CashShift => {
    const todayDate = new Date().toISOString().split('T')[0];
    const existingOpen = cashShifts.find(
      (s) => s.storeId === activeStoreId && s.status === 'open'
    );
    if (existingOpen) {
      const updated: CashShift = {
        ...existingOpen,
        openingFloat,
        notes: notes !== undefined ? notes : existingOpen.notes,
      };
      setCashShifts((prev) =>
        prev.map((s) => (s.id === existingOpen.id ? updated : s))
      );
      return updated;
    }

    const newShift: CashShift = {
      id: `shift-${Date.now()}`,
      storeId: activeStoreId,
      date: todayDate,
      startTime: new Date().toISOString(),
      cashierId: currentUser?.id || 'cashier-1',
      cashierName: currentUser?.name || activeCashier || 'Kasir',
      openingFloat,
      cashSales: 0,
      nonCashSales: 0,
      cashExpenses: 0,
      expectedCash: openingFloat,
      status: 'open',
      notes: notes || `Modal kasir awal dibuka Rp ${openingFloat.toLocaleString('id-ID')}`,
    };

    setCashShifts((prev) => [newShift, ...prev]);
    return newShift;
  };

  const updateOpeningFloat = (shiftId: string, newFloat: number) => {
    setCashShifts((prev) =>
      prev.map((s) => (s.id === shiftId ? { ...s, openingFloat: newFloat } : s))
    );
  };

  const getDailyCashSummary = (
    dateStr?: string,
    storeId?: string
  ): DailyCashSummary => {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const targetStore = storeId || activeStoreId;

    // Filter sales for date & store
    const daySales = sales.filter((s) => {
      const isSameDate = s.date.startsWith(targetDate);
      const isSameStore = targetStore === 'all' || s.storeId === targetStore;
      const isCompleted = s.status === 'completed';
      return isSameDate && isSameStore && isCompleted;
    });

    // Filter expenses for date & store
    const dayExpenses = cashExpenses.filter((e) => {
      const isSameDate = e.date.startsWith(targetDate);
      const isSameStore = targetStore === 'all' || e.storeId === targetStore;
      return isSameDate && isSameStore;
    });

    // Shifts for modal awal
    const dayShifts = cashShifts.filter((s) => {
      const isSameDate = s.date === targetDate;
      const isSameStore = targetStore === 'all' || s.storeId === targetStore;
      return isSameDate && isSameStore;
    });

    const openingFloat = dayShifts.reduce(
      (acc, s) => acc + (s.openingFloat || 0),
      0
    );

    const grossSales = daySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const cashSales = daySales
      .filter((s) => s.paymentMethod === 'cash')
      .reduce((acc, s) => acc + s.totalAmount, 0);
    const digitalSales = grossSales - cashSales;

    const totalCost = daySales.reduce((acc, s) => {
      const itemCost = s.items.reduce(
        (iAcc, item) => iAcc + (item.costPrice || 0) * item.quantity,
        0
      );
      return acc + itemCost;
    }, 0);
    const grossProfit = grossSales - totalCost;

    const totalExpenses = dayExpenses.reduce((acc, e) => acc + e.amount, 0);
    const cashExpensesSum = dayExpenses
      .filter((e) => e.paymentMethod === 'cash')
      .reduce((acc, e) => acc + e.amount, 0);
    const nonCashExpenses = totalExpenses - cashExpensesSum;

    const expectedCashInDrawer = openingFloat + cashSales - cashExpensesSum;
    const netCashFlow = grossSales - totalExpenses;
    const netOperatingProfit = grossProfit - totalExpenses;

    const latestClosedShift = dayShifts.find((s) => s.status === 'closed');

    return {
      date: targetDate,
      storeId: targetStore,
      openingFloat,
      grossSales,
      cashSales,
      digitalSales,
      totalExpenses,
      cashExpenses: cashExpensesSum,
      nonCashExpenses,
      expectedCashInDrawer,
      actualCashInDrawer: latestClosedShift?.actualCash,
      cashDifference: latestClosedShift?.cashDifference,
      netCashFlow,
      grossProfit,
      netOperatingProfit,
      salesCount: daySales.length,
      expensesCount: dayExpenses.length,
    };
  };

  const closeShift = (
    shiftId: string,
    actualCash: number,
    notes?: string
  ): CashShift => {
    const target = cashShifts.find((s) => s.id === shiftId);
    const shiftDate = target?.date || new Date().toISOString().split('T')[0];
    const storeId = target?.storeId || activeStoreId;
    const summary = getDailyCashSummary(shiftDate, storeId);
    const expected = summary.expectedCashInDrawer;
    const diff = actualCash - expected;

    let closedShift: CashShift | null = null;

    setCashShifts((prev) =>
      prev.map((s) => {
        if (s.id === shiftId) {
          closedShift = {
            ...s,
            endTime: new Date().toISOString(),
            cashSales: summary.cashSales,
            nonCashSales: summary.digitalSales,
            cashExpenses: summary.cashExpenses,
            expectedCash: expected,
            actualCash,
            cashDifference: diff,
            status: 'closed',
            closedBy: currentUser?.name || activeCashier,
            closedAt: new Date().toISOString(),
            notes: notes || s.notes,
          };
          return closedShift;
        }
        return s;
      })
    );

    return (
      closedShift || {
        id: shiftId,
        storeId,
        date: shiftDate,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        cashierId: currentUser?.id || 'cashier-1',
        cashierName: currentUser?.name || activeCashier,
        openingFloat: target?.openingFloat || 0,
        cashSales: summary.cashSales,
        nonCashSales: summary.digitalSales,
        cashExpenses: summary.cashExpenses,
        expectedCash: expected,
        actualCash,
        cashDifference: diff,
        status: 'closed',
        closedBy: currentUser?.name || activeCashier,
        closedAt: new Date().toISOString(),
      }
    );
  };

  const addExpense = (
    expenseData: Omit<CashExpense, 'id' | 'date'>
  ): CashExpense => {
    const newExpense: CashExpense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      date: new Date().toISOString(),
      storeId: expenseData.storeId || activeStoreId,
      recordedBy: expenseData.recordedBy || currentUser?.name || activeCashier,
      recordedById: expenseData.recordedById || currentUser?.id,
    };
    setCashExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  };

  const updateExpense = (id: string, updates: Partial<CashExpense>) => {
    setCashExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const deleteExpense = (id: string) => {
    setCashExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Digital Products & PPOB Methods
  const topUpDepositBalance = (amount: number, note?: string) => {
    if (amount <= 0) return;
    setDigitalDepositBalance((prev) => prev + amount);
  };

  const updateDigitalProductPrice = (productId: string, newSellingPrice: number) => {
    setDigitalProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, sellingPrice: newSellingPrice } : p))
    );
  };

  const syncPPOBServerBalance = async (): Promise<number> => {
    const ppobConfig = settings.ppobGateway || DEFAULT_PPOB_SETTINGS;
    const res = await fetchPPOBServerBalance(ppobConfig);
    setDigitalDepositBalance(res.balance);
    setSettings((prev) => ({
      ...prev,
      ppobGateway: {
        ...(prev.ppobGateway || DEFAULT_PPOB_SETTINGS),
        serverBalance: res.balance,
        lastBalanceSync: res.timestamp,
      },
    }));
    return res.balance;
  };

  const syncProductsFromDigiFlazz = async (): Promise<{ count: number; error?: string }> => {
    try {
      const ppobConfig = settings.ppobGateway || DEFAULT_PPOB_SETTINGS;
      const fetched = await fetchDigiFlazzPriceList(ppobConfig);
      if (fetched.length > 0) {
        setDigitalProducts((prev) => {
          const existingMap = new Map<string, DigitalProduct>(prev.map((p) => [p.buyerSkuCode || p.id, p]));
          const merged = fetched.map((f) => {
            const key = f.buyerSkuCode || f.id;
            const exist = existingMap.get(key);
            if (exist && exist.sellingPrice > f.costPrice) {
              return {
                ...f,
                sellingPrice: exist.sellingPrice,
              };
            }
            return f;
          });
          localStorage.setItem(STORAGE_KEYS.DIGITAL_PRODUCTS, JSON.stringify(merged));
          return merged;
        });
        return { count: fetched.length };
      }
      return { count: 0, error: 'Tidak ada produk yang diterima dari server DigiFlazz' };
    } catch (err: any) {
      return { count: 0, error: err.message || 'Gagal menyinkronkan produk' };
    }
  };

  const processDigitalTransaction = async (payload: {
    productId: string;
    targetNumber: string;
    customerName?: string;
    paymentMethod: PaymentMethod;
    customSellingPrice?: number;
    inquiryData?: DigitalInquiryData;
    manualSN?: string;
    forceManualFallback?: boolean;
    notes?: string;
  }): Promise<DigitalTransaction> => {
    const product = digitalProducts.find((p) => p.id === payload.productId);
    if (!product) {
      throw new Error('Produk digital tidak ditemukan');
    }

    const ppobConfig = settings.ppobGateway || DEFAULT_PPOB_SETTINGS;
    const isManualMode = ppobConfig.mode === 'manual' || !!payload.forceManualFallback;

    const sellingPrice = payload.customSellingPrice !== undefined && payload.customSellingPrice > 0
      ? payload.customSellingPrice
      : (product.sellingPrice > 0 ? product.sellingPrice : ((payload.inquiryData?.totalBill || 0) + (product.adminFee || 2500)));

    const adminFee = product.adminFee || (product.category === 'pln' || product.category === 'postpaid' ? 2500 : 0);
    const costPrice = product.costPrice > 0 ? product.costPrice : (payload.inquiryData?.totalBill || 0);
    const totalPaid = sellingPrice;
    const profit = Math.max(0, totalPaid - costPrice);

    // Execute via PPOB Switcher API or Manual fallback
    const execResult = await executePPOBTransaction({
      config: {
        ...ppobConfig,
        serverBalance: digitalDepositBalance,
      },
      product,
      targetNumber: payload.targetNumber,
      customerName: payload.customerName,
      manualSN: payload.manualSN,
      forceManualFallback: payload.forceManualFallback,
    });

    const now = new Date();
    const invoiceNumber = `PPOB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(100 + Math.random() * 900))}`;

    const newTx: DigitalTransaction = {
      id: `digi-tx-${Date.now()}`,
      invoiceNumber,
      storeId: activeStoreId,
      category: product.category,
      provider: product.provider,
      productId: product.id,
      productName: product.name,
      denomination: product.denomination,
      targetNumber: payload.targetNumber,
      customerName: payload.customerName || (payload.inquiryData?.subscriberName ? payload.inquiryData.subscriberName : 'Pelanggan Umum'),
      costPrice,
      sellingPrice,
      adminFee,
      profit,
      totalPaid,
      paymentMethod: payload.paymentMethod,
      status: 'success',
      serialNumber: execResult.serialNumber,
      inquiryData: payload.inquiryData,
      cashierName: currentUser?.name || activeCashier,
      cashierId: currentUser?.id,
      processingMode: execResult.mode,
      apiProvider: execResult.providerName,
      apiRefId: execResult.refId,
      apiStatusCode: execResult.responseCode,
      manualInputReason: isManualMode ? (payload.manualSN ? 'Input manual dari aplikasi agen HP/EDC' : 'Mode manual toko') : undefined,
      createdAt: now.toISOString(),
      completedAt: new Date(now.getTime() + 1200).toISOString(),
      notes: payload.notes || (isManualMode ? 'Transaksi diproses manual kasir' : 'Transaksi sukses via API Gateway'),
    };

    // Deduct cost price from server deposit balance
    if (costPrice > 0) {
      setDigitalDepositBalance((prev) => Math.max(0, prev - costPrice));
      setSettings((prev) => ({
        ...prev,
        ppobGateway: prev.ppobGateway
          ? {
              ...prev.ppobGateway,
              serverBalance: Math.max(0, (prev.ppobGateway.serverBalance || digitalDepositBalance) - costPrice),
              lastBalanceSync: new Date().toISOString(),
            }
          : undefined,
      }));
    }

    // Append to transactions history
    setDigitalTransactions((prev) => [newTx, ...prev]);

    return newTx;
  };

  // Backup & Reset
  const resetToDefault = () => {
    setUsers(INITIAL_USERS);
    setStores(INITIAL_STORES);
    setActiveStoreIdState(INITIAL_STORES[0]?.id || 'store-1');
    setCustomers(INITIAL_CUSTOMERS);
    setCategories(INITIAL_CATEGORIES);
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setStockLogs([]);
    setCashShifts(INITIAL_CASH_SHIFTS);
    setCashExpenses(INITIAL_CASH_EXPENSES);
    setDigitalProducts(INITIAL_DIGITAL_PRODUCTS);
    setDigitalTransactions(INITIAL_DIGITAL_TRANSACTIONS);
    setDigitalDepositBalance(INITIAL_DEPOSIT_BALANCE);
    setSettings(INITIAL_SETTINGS);
    setCart([]);
    localStorage.clear();
  };

  const exportDatabaseJSON = (): string => {
    const data = {
      users,
      stores,
      activeStoreId,
      customers,
      products,
      categories,
      sales,
      stockLogs,
      cashShifts,
      cashExpenses,
      digitalProducts,
      digitalTransactions,
      digitalDepositBalance,
      settings,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  };

  const importDatabaseJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.users && Array.isArray(data.users)) setUsers(data.users);
      if (data.stores && Array.isArray(data.stores)) setStores(data.stores);
      if (data.customers && Array.isArray(data.customers)) setCustomers(data.customers);
      if (data.products && Array.isArray(data.products)) setProducts(data.products);
      if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
      if (data.sales && Array.isArray(data.sales)) setSales(data.sales);
      if (data.stockLogs && Array.isArray(data.stockLogs)) setStockLogs(data.stockLogs);
      if (data.cashShifts && Array.isArray(data.cashShifts)) setCashShifts(data.cashShifts);
      if (data.cashExpenses && Array.isArray(data.cashExpenses)) setCashExpenses(data.cashExpenses);
      if (data.digitalProducts && Array.isArray(data.digitalProducts)) setDigitalProducts(data.digitalProducts);
      if (data.digitalTransactions && Array.isArray(data.digitalTransactions)) setDigitalTransactions(data.digitalTransactions);
      if (typeof data.digitalDepositBalance === 'number') setDigitalDepositBalance(data.digitalDepositBalance);
      if (data.settings) setSettings(data.settings);
      if (data.activeStoreId) setActiveStoreIdState(data.activeStoreId);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        users,
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        logout,
        switchUser,
        addUser,
        updateUser,
        deleteUser,
        hasRole,
        canAccessTab,
        activeTab,
        setActiveTab,
        activeCashier,
        setActiveCashier,
        settings,
        setSettings,
        cashShifts,
        cashExpenses,
        currentShift,
        openShift,
        updateOpeningFloat,
        closeShift,
        addExpense,
        updateExpense,
        deleteExpense,
        getDailyCashSummary,
        stores,
        activeStoreId,
        activeStore,
        selectedStoreFilter,
        setActiveStoreId,
        setSelectedStoreFilter,
        addStore,
        updateStore,
        deleteStore,
        transferProductStock,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        adjustCustomerPoints,
        products,
        categories,
        lowStockProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        restockProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        sales,
        stockLogs,
        processCheckout,
        refundSale,
        settleDebtSale,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        loadCart,
        cartTotals,
        digitalProducts,
        digitalTransactions,
        digitalDepositBalance,
        topUpDepositBalance,
        syncPPOBServerBalance,
        syncProductsFromDigiFlazz,
        processDigitalTransaction,
        updateDigitalProductPrice,
        theme,
        setTheme,
        toggleTheme,
        resetToDefault,
        exportDatabaseJSON,
        importDatabaseJSON,
        isCloudSynced,
        isSyncing,
        lastSyncTime,
        syncWithServer: pullFromServer,
        pushToServer,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

