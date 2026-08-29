import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { createClient, Client } from '@libsql/client';

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://kasiready-db-imranalwi001-creator.aws-ap-northeast-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc5OTc2OTMsImlkIjoiMDFhMDRjZjUtZDIwMS03ZmZmLTgzZTYtYmJiNDZhYzg1ODVmIiwia2lkIjoibkdMTmRjb3ZnUGJJc0YzM0J3cUhtOTh0SDZXTE1XSGJiVVdxYUpjajl5ayIsInJpZCI6Ijc2ZmE5ZGVhLTZlZDctNGM1My04YmRmLWY0YTRjYmE5YWY3ZiJ9.wnNhkj8_WEz9q68zDDtQCT5mSiYw0YjtDKmDQLeq3cOxmFWIe4QqvReWuVdl_j_d0gusLn0pST14yNX3LLOTBQ';

let tursoClient: Client | null = null;

function getClient(): Client {
  if (!tursoClient) {
    tursoClient = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });
  }
  return tursoClient;
}

function calculateMD5(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

// In-memory fallback
let serverCache: any = null;

// Health check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const client = getClient();
    const ping = await client.execute("SELECT 1 as connected, datetime('now') as server_time;");
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      tursoConnected: true,
      tursoTime: ping.rows[0]?.server_time,
    });
  } catch (err: any) {
    res.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      tursoConnected: false,
      error: err.message,
    });
  }
});

// GET /api/pos/data
app.get('/api/pos/data', async (req: Request, res: Response) => {
  try {
    const client = getClient();
    const result = await client.execute("SELECT data_json FROM app_settings WHERE id = 'main_settings' LIMIT 1;");
    if (result.rows.length > 0 && result.rows[0].data_json) {
      const data = JSON.parse(String(result.rows[0].data_json));
      serverCache = data;
      return res.json({
        success: true,
        hasData: true,
        data,
        source: 'turso_cloud',
        timestamp: data.updatedAt || new Date().toISOString(),
      });
    }

    if (serverCache) {
      return res.json({
        success: true,
        hasData: true,
        data: serverCache,
        source: 'server_cache',
        timestamp: serverCache.updatedAt,
      });
    }

    res.json({
      success: true,
      hasData: false,
      data: null,
      message: 'No data yet in Turso',
    });
  } catch (err: any) {
    if (serverCache) {
      return res.json({ success: true, hasData: true, data: serverCache, source: 'cache_fallback' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/pos/sync
app.post('/api/pos/sync', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    const client = getClient();
    const now = new Date().toISOString();

    // Fetch existing
    let existingData: any = serverCache;
    try {
      const result = await client.execute("SELECT data_json FROM app_settings WHERE id = 'main_settings' LIMIT 1;");
      if (result.rows.length > 0 && result.rows[0].data_json) {
        existingData = JSON.parse(String(result.rows[0].data_json));
      }
    } catch {}

    const currentDb = existingData || {};

    // Smart merge products
    const productMap = new Map<string, any>();
    if (Array.isArray(currentDb.products)) {
      currentDb.products.forEach((p: any) => { if (p?.id) productMap.set(p.id, p); });
    }
    if (Array.isArray(payload.products)) {
      payload.products.forEach((p: any) => {
        if (p?.id) {
          const exist = productMap.get(p.id);
          if (!exist) {
            productMap.set(p.id, p);
          } else {
            const inTime = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
            const exTime = exist.updatedAt ? new Date(exist.updatedAt).getTime() : 0;
            if (inTime >= exTime) productMap.set(p.id, { ...exist, ...p });
          }
        }
      });
    }

    const mergedDb = {
      ...currentDb,
      ...payload,
      products: Array.from(productMap.values()),
      updatedAt: now,
    };

    serverCache = mergedDb;

    // Save to Turso
    await client.execute({
      sql: "INSERT INTO app_settings (id, data_json, updatedAt) VALUES ('main_settings', ?, ?) ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, updatedAt = excluded.updatedAt;",
      args: [JSON.stringify(mergedDb), now],
    });

    res.json({
      success: true,
      message: 'Successfully synced to Turso Cloud',
      timestamp: now,
      productCount: mergedDb.products.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/pos/products
app.post('/api/pos/products', async (req: Request, res: Response) => {
  try {
    const newProduct = req.body;
    if (!newProduct || !newProduct.name) {
      return res.status(400).json({ success: false, message: 'Nama produk wajib diisi' });
    }

    const client = getClient();
    const now = new Date().toISOString();

    let db: any = serverCache || { products: [] };
    try {
      const result = await client.execute("SELECT data_json FROM app_settings WHERE id = 'main_settings' LIMIT 1;");
      if (result.rows.length > 0 && result.rows[0].data_json) {
        db = JSON.parse(String(result.rows[0].data_json));
      }
    } catch {}

    const products = Array.isArray(db.products) ? [...db.products] : [];
    const filtered = products.filter((p: any) => p.id !== newProduct.id);
    filtered.unshift(newProduct);
    db.products = filtered;
    db.updatedAt = now;

    serverCache = db;

    await client.execute({
      sql: "INSERT INTO app_settings (id, data_json, updatedAt) VALUES ('main_settings', ?, ?) ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, updatedAt = excluded.updatedAt;",
      args: [JSON.stringify(db), now],
    });

    // Also insert to products table
    try {
      await client.execute({
        sql: `INSERT INTO products (id, sku, barcode, name, categoryId, costPrice, sellingPrice, stock, minStock, unit, isService, active, storeId, image, description, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET name=excluded.name, sku=excluded.sku, sellingPrice=excluded.sellingPrice, costPrice=excluded.costPrice, stock=excluded.stock, updatedAt=excluded.updatedAt;`,
        args: [
          newProduct.id, newProduct.sku || '', newProduct.barcode || '', newProduct.name, newProduct.categoryId || '',
          newProduct.costPrice || 0, newProduct.price || newProduct.sellingPrice || 0, newProduct.stock || 0,
          newProduct.minStockAlert || 10, newProduct.unit || 'pcs', 0, 1, newProduct.storeId || 'store-1',
          newProduct.image || '', newProduct.description || '', now, now
        ]
      });
    } catch {}

    res.json({ success: true, product: newProduct });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/pos/products/:id
app.put('/api/pos/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const client = getClient();
    const now = new Date().toISOString();

    let db: any = serverCache || { products: [] };
    try {
      const result = await client.execute("SELECT data_json FROM app_settings WHERE id = 'main_settings' LIMIT 1;");
      if (result.rows.length > 0 && result.rows[0].data_json) {
        db = JSON.parse(String(result.rows[0].data_json));
      }
    } catch {}

    const products = Array.isArray(db.products) ? [...db.products] : [];
    const index = products.findIndex((p: any) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    products[index] = { ...products[index], ...updates, updatedAt: now };
    db.products = products;
    db.updatedAt = now;
    const updatedItem = products[index];

    await client.execute({
      sql: "INSERT INTO app_settings (id, data_json, updatedAt) VALUES ('main_settings', ?, ?) ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, updatedAt = excluded.updatedAt;",
      args: [JSON.stringify(db), now],
    });

    // Also update products relational table in Turso
    try {
      await client.execute({
        sql: `UPDATE products SET 
                name = COALESCE(?, name),
                sku = COALESCE(?, sku),
                barcode = COALESCE(?, barcode),
                sellingPrice = COALESCE(?, sellingPrice),
                costPrice = COALESCE(?, costPrice),
                stock = COALESCE(?, stock),
                minStock = COALESCE(?, minStock),
                unit = COALESCE(?, unit),
                categoryId = COALESCE(?, categoryId),
                storeId = COALESCE(?, storeId),
                image = COALESCE(?, image),
                description = COALESCE(?, description),
                updatedAt = ?
              WHERE id = ?;`,
        args: [
          updates.name !== undefined ? updates.name : null,
          updates.sku !== undefined ? updates.sku : null,
          updates.barcode !== undefined ? updates.barcode : null,
          (updates.price !== undefined ? updates.price : updates.sellingPrice) ?? null,
          updates.costPrice !== undefined ? updates.costPrice : null,
          updates.stock !== undefined ? updates.stock : null,
          updates.minStockAlert !== undefined ? updates.minStockAlert : null,
          updates.unit !== undefined ? updates.unit : null,
          updates.categoryId !== undefined ? updates.categoryId : null,
          updates.storeId !== undefined ? updates.storeId : null,
          updates.image !== undefined ? updates.image : null,
          updates.description !== undefined ? updates.description : null,
          now,
          id,
        ],
      });
    } catch (sqlErr: any) {
      console.warn('Failed updating relational products table:', sqlErr.message);
    }

    res.json({ success: true, product: updatedItem });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/pos/products/:id
app.delete('/api/pos/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client = getClient();
    const now = new Date().toISOString();

    let db: any = serverCache || { products: [] };
    try {
      const result = await client.execute("SELECT data_json FROM app_settings WHERE id = 'main_settings' LIMIT 1;");
      if (result.rows.length > 0 && result.rows[0].data_json) {
        db = JSON.parse(String(result.rows[0].data_json));
      }
    } catch {}

    const products = Array.isArray(db.products) ? [...db.products] : [];
    db.products = products.filter((p: any) => p.id !== id);
    db.updatedAt = now;
    serverCache = db;

    await client.execute({
      sql: "INSERT INTO app_settings (id, data_json, updatedAt) VALUES ('main_settings', ?, ?) ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, updatedAt = excluded.updatedAt;",
      args: [JSON.stringify(db), now],
    });

    try {
      await client.execute({
        sql: "DELETE FROM products WHERE id = ?;",
        args: [id]
      });
    } catch {}

    res.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DigiFlazz Endpoints
app.post('/api/digiflazz/transaction', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { buyerSkuCode, customerNo, refId, username, apiKey, testing = false, maxPrice } = req.body;
    if (!buyerSkuCode || !customerNo || !refId || !username || !apiKey) {
      return res.status(400).json({ success: false, message: 'Parameter transaksi DigiFlazz belum lengkap' });
    }

    const sign = calculateMD5(`${username}${apiKey}${refId}`);
    const requestPayload: any = { username, buyer_sku_code: buyerSkuCode, customer_no: customerNo, ref_id: refId, sign, testing };
    if (maxPrice && Number(maxPrice) > 0) requestPayload.max_price = Number(maxPrice);

    const digiflazzRes = await fetch('https://api.digiflazz.com/v1/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });

    const digiflazzData = await digiflazzRes.json();
    res.json({
      success: true,
      httpStatus: digiflazzRes.status,
      latencyMs: Date.now() - startTime,
      request: requestPayload,
      response: digiflazzData,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/digiflazz/cek-saldo', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { username, apiKey } = req.body;
    if (!username || !apiKey) {
      return res.status(400).json({ success: false, message: 'Username dan apiKey wajib diisi' });
    }

    const sign = calculateMD5(`${username}${apiKey}depo`);
    const requestPayload = { cmd: 'deposit', username, sign };

    const digiflazzRes = await fetch('https://api.digiflazz.com/v1/cek-saldo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });

    const digiflazzData = await digiflazzRes.json();
    res.json({
      success: true,
      httpStatus: digiflazzRes.status,
      latencyMs: Date.now() - startTime,
      request: requestPayload,
      response: digiflazzData,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const priceListCache: Record<string, { data: any[]; timestamp: number }> = {};

app.post('/api/digiflazz/price-list', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { username, apiKey, cmd = 'prepaid' } = req.body;
    if (!username || !apiKey) {
      return res.status(400).json({ success: false, message: 'Username dan apiKey wajib diisi' });
    }

    const cacheKey = `${username}_${cmd}`;
    const sign = calculateMD5(`${username}${apiKey}pricelist`);
    const requestPayload = { cmd, username, sign };

    let digiflazzData: any;
    let httpStatus = 200;

    try {
      const digiflazzRes = await fetch('https://api.digiflazz.com/v1/price-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });
      httpStatus = digiflazzRes.status;
      digiflazzData = await digiflazzRes.json();
    } catch {
      digiflazzData = { data: [] };
    }

    if (Array.isArray(digiflazzData?.data) && digiflazzData.data.length > 0) {
      priceListCache[cacheKey] = { data: digiflazzData.data, timestamp: Date.now() };
    } else if (priceListCache[cacheKey]?.data?.length) {
      digiflazzData = {
        data: priceListCache[cacheKey].data,
        cached: true,
        note: 'Menggunakan data cache produk aktif terbaru',
      };
    }

    res.json({
      success: true,
      httpStatus,
      latencyMs: Date.now() - startTime,
      request: requestPayload,
      response: digiflazzData,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/digiflazz/inquiry', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { buyerSkuCode, customerNo, refId, username, apiKey, testing = false } = req.body;
    if (!buyerSkuCode || !customerNo || !refId || !username || !apiKey) {
      return res.status(400).json({ success: false, message: 'Parameter tagihan belum lengkap' });
    }

    const sign = calculateMD5(`${username}${apiKey}${refId}`);
    const requestPayload = { commands: 'inq-pasca', username, buyer_sku_code: buyerSkuCode, customer_no: customerNo, ref_id: refId, sign, testing };

    const digiflazzRes = await fetch('https://api.digiflazz.com/v1/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });

    const digiflazzData = await digiflazzRes.json();
    res.json({
      success: true,
      httpStatus: digiflazzRes.status,
      latencyMs: Date.now() - startTime,
      request: requestPayload,
      response: digiflazzData,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default app;
