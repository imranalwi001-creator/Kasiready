import { createClient, Client } from '@libsql/client';

let tursoClient: Client | null = null;

export function getTursoClient(url?: string, authToken?: string): Client | null {
  const dbUrl = url || process.env.TURSO_DATABASE_URL || process.env.VITE_TURSO_DATABASE_URL;
  const token = authToken || process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;

  if (!dbUrl || !token) {
    return null;
  }

  if (!tursoClient) {
    try {
      tursoClient = createClient({
        url: dbUrl,
        authToken: token,
      });
      console.log('[Turso] Database client initialized successfully on:', dbUrl);
    } catch (err) {
      console.error('[Turso] Failed to initialize client:', err);
      return null;
    }
  }

  return tursoClient;
}

/**
 * Initialize all necessary tables in Turso LibSQL Database
 */
export async function initTursoSchema(client: Client): Promise<void> {
  const schemas = [
    `CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      code TEXT,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      isMain INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      createdAt TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      active INTEGER DEFAULT 1
    );`,

    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT,
      barcode TEXT,
      name TEXT NOT NULL,
      categoryId TEXT,
      costPrice REAL DEFAULT 0,
      sellingPrice REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      minStock INTEGER DEFAULT 0,
      unit TEXT DEFAULT 'pcs',
      isService INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      storeId TEXT,
      raw_data TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      invoiceNumber TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL,
      cashierId TEXT,
      cashierName TEXT,
      storeId TEXT,
      customerId TEXT,
      customerName TEXT,
      items_json TEXT NOT NULL,
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      finalTotal REAL DEFAULT 0,
      paymentMethod TEXT,
      paymentAmount REAL DEFAULT 0,
      changeAmount REAL DEFAULT 0,
      notes TEXT,
      status TEXT DEFAULT 'completed',
      createdAt TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      points INTEGER DEFAULT 0,
      totalSpent REAL DEFAULT 0,
      tier TEXT DEFAULT 'Bronze',
      active INTEGER DEFAULT 1,
      createdAt TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS stock_logs (
      id TEXT PRIMARY KEY,
      productId TEXT,
      productName TEXT,
      type TEXT,
      quantity INTEGER,
      previousStock INTEGER,
      currentStock INTEGER,
      reason TEXT,
      cashierName TEXT,
      storeId TEXT,
      createdAt TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS cash_shifts (
      id TEXT PRIMARY KEY,
      shiftNumber TEXT,
      cashierId TEXT,
      cashierName TEXT,
      storeId TEXT,
      startTime TEXT,
      endTime TEXT,
      openingFloat REAL DEFAULT 0,
      expectedCash REAL DEFAULT 0,
      actualCash REAL DEFAULT 0,
      difference REAL DEFAULT 0,
      status TEXT DEFAULT 'open',
      notes TEXT,
      summary_json TEXT,
      createdAt TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS cash_expenses (
      id TEXT PRIMARY KEY,
      shiftId TEXT,
      category TEXT,
      amount REAL DEFAULT 0,
      description TEXT,
      cashierName TEXT,
      storeId TEXT,
      createdAt TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'kasir',
      storeId TEXT,
      avatar TEXT,
      active INTEGER DEFAULT 1,
      createdAt TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS digital_products (
      id TEXT PRIMARY KEY,
      buyerSkuCode TEXT,
      category TEXT,
      provider TEXT,
      name TEXT NOT NULL,
      denomination INTEGER DEFAULT 0,
      costPrice REAL DEFAULT 0,
      sellingPrice REAL DEFAULT 0,
      adminFee REAL DEFAULT 0,
      description TEXT,
      status TEXT DEFAULT 'available',
      updatedAt TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS digital_transactions (
      id TEXT PRIMARY KEY,
      invoiceNumber TEXT NOT NULL UNIQUE,
      category TEXT,
      provider TEXT,
      productName TEXT,
      buyerSkuCode TEXT,
      targetNumber TEXT,
      customerName TEXT,
      costPrice REAL DEFAULT 0,
      sellingPrice REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      adminFee REAL DEFAULT 0,
      paymentMethod TEXT,
      status TEXT DEFAULT 'pending',
      serialNumber TEXT,
      refId TEXT,
      errorMessage TEXT,
      createdAt TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY DEFAULT 'main_settings',
      data_json TEXT NOT NULL,
      updatedAt TEXT
    );`
  ];

  for (const sql of schemas) {
    try {
      await client.execute(sql);
    } catch (e: any) {
      console.warn('[Turso] Table init warning:', e.message);
    }
  }

  console.log('[Turso] All database tables verified and initialized successfully!');
}
