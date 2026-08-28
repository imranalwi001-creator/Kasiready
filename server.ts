import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database file path for persistent multi-device storage
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'pos_database.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// In-memory cache for fast access and fallback
let memoryDb: any = null;

function loadDatabaseFromDisk(): any {
  if (memoryDb) return memoryDb;
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      memoryDb = JSON.parse(data);
      console.log('Database loaded from disk. Total products:', memoryDb.products?.length || 0);
      return memoryDb;
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  return null;
}

function saveDatabaseToDisk(data: any) {
  memoryDb = { ...data, updatedAt: new Date().toISOString() };
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
    console.log('Database saved to disk at', new Date().toISOString());
  } catch (err) {
    console.error('Error writing database to disk:', err);
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    serverTime: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
    hasStoredDb: !!memoryDb || fs.existsSync(DB_FILE),
  });
});

// GET all synced data
app.get('/api/pos/data', (req, res) => {
  const db = loadDatabaseFromDisk();
  if (db) {
    res.json({
      success: true,
      hasData: true,
      data: db,
      timestamp: db.updatedAt || new Date().toISOString(),
    });
  } else {
    res.json({
      success: true,
      hasData: false,
      data: null,
      message: 'No server database yet, client will push initial state',
    });
  }
});

// POST sync full database with non-destructive merge
app.post('/api/pos/sync', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    const currentDb = loadDatabaseFromDisk() || {};

    // Smart merge products by id
    const productMap = new Map();
    if (Array.isArray(currentDb.products)) {
      currentDb.products.forEach((p: any) => {
        if (p && p.id) productMap.set(p.id, p);
      });
    }
    if (Array.isArray(payload.products)) {
      payload.products.forEach((p: any) => {
        if (p && p.id) {
          const existing = productMap.get(p.id);
          if (!existing) {
            productMap.set(p.id, p);
          } else {
            const incomingTime = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
            const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
            if (incomingTime >= existingTime) {
              productMap.set(p.id, { ...existing, ...p });
            }
          }
        }
      });
    }

    // Merge categories
    const categoryMap = new Map();
    if (Array.isArray(currentDb.categories)) {
      currentDb.categories.forEach((c: any) => {
        if (c && c.id) categoryMap.set(c.id, c);
      });
    }
    if (Array.isArray(payload.categories)) {
      payload.categories.forEach((c: any) => {
        if (c && c.id) categoryMap.set(c.id, c);
      });
    }

    // Merge sales by id
    const salesMap = new Map();
    if (Array.isArray(currentDb.sales)) {
      currentDb.sales.forEach((s: any) => {
        if (s && s.id) salesMap.set(s.id, s);
      });
    }
    if (Array.isArray(payload.sales)) {
      payload.sales.forEach((s: any) => {
        if (s && s.id) salesMap.set(s.id, s);
      });
    }

    // Merge customers by id
    const customerMap = new Map();
    if (Array.isArray(currentDb.customers)) {
      currentDb.customers.forEach((c: any) => {
        if (c && c.id) customerMap.set(c.id, c);
      });
    }
    if (Array.isArray(payload.customers)) {
      payload.customers.forEach((c: any) => {
        if (c && c.id) customerMap.set(c.id, c);
      });
    }

    // Merge stores
    const storeMap = new Map();
    if (Array.isArray(currentDb.stores)) {
      currentDb.stores.forEach((st: any) => {
        if (st && st.id) storeMap.set(st.id, st);
      });
    }
    if (Array.isArray(payload.stores)) {
      payload.stores.forEach((st: any) => {
        if (st && st.id) storeMap.set(st.id, st);
      });
    }

    const updatedDb = {
      ...currentDb,
      ...payload,
      products: Array.from(productMap.values()),
      categories: Array.from(categoryMap.values()),
      sales: Array.from(salesMap.values()),
      customers: Array.from(customerMap.values()),
      stores: Array.from(storeMap.values()),
      updatedAt: new Date().toISOString(),
    };

    saveDatabaseToDisk(updatedDb);

    res.json({
      success: true,
      message: 'Data successfully synchronized across all devices',
      timestamp: updatedDb.updatedAt,
      productCount: updatedDb.products?.length || 0,
      data: updatedDb,
    });
  } catch (err: any) {
    console.error('Error during database sync:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/pos/products
app.get('/api/pos/products', (req, res) => {
  const db = loadDatabaseFromDisk();
  res.json({
    success: true,
    products: db?.products || [],
  });
});

// POST single product (Create)
app.post('/api/pos/products', (req, res) => {
  try {
    const newProduct = req.body;
    if (!newProduct || !newProduct.name) {
      return res.status(400).json({ success: false, message: 'Nama produk wajib diisi' });
    }

    const db = loadDatabaseFromDisk() || { products: [] };
    const products = Array.isArray(db.products) ? [...db.products] : [];
    
    // Add product
    products.unshift(newProduct);
    db.products = products;
    saveDatabaseToDisk(db);

    res.json({ success: true, product: newProduct });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT single product (Update)
app.put('/api/pos/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const db = loadDatabaseFromDisk() || { products: [] };
    const products = Array.isArray(db.products) ? [...db.products] : [];
    
    const index = products.findIndex((p: any) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    products[index] = { ...products[index], ...updates, updatedAt: new Date().toISOString() };
    db.products = products;
    saveDatabaseToDisk(db);

    res.json({ success: true, product: products[index] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE single product (Delete)
app.delete('/api/pos/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = loadDatabaseFromDisk() || { products: [] };
    const products = Array.isArray(db.products) ? [...db.products] : [];
    
    db.products = products.filter((p: any) => p.id !== id);
    saveDatabaseToDisk(db);

    res.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Start Server with Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server POS running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
