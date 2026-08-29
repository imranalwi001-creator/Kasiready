import { createClient } from '@libsql/client';

const url = 'libsql://kasiready-db-imranalwi001-creator.aws-ap-northeast-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc5OTc2OTMsImlkIjoiMDFhMDRjZjUtZDIwMS03ZmZmLTgzZTYtYmJiNDZhYzg1ODVmIiwia2lkIjoibkdMTmRjb3ZnUGJJc0YzM0J3cUhtOTh0SDZXTE1XSGJiVVdxYUpjajl5ayIsInJpZCI6Ijc2ZmE5ZGVhLTZlZDctNGM1My04YmRmLWY0YTRjYmE5YWY3ZiJ9.wnNhkj8_WEz9q68zDDtQCT5mSiYw0YjtDKmDQLeq3cOxmFWIe4QqvReWuVdl_j_d0gusLn0pST14yNX3LLOTBQ';

async function check() {
  const client = createClient({ url, authToken });

  const rokokTable = await client.execute("SELECT id, name, sku, stock, sellingPrice FROM products WHERE name LIKE '%rokok%' OR sku LIKE '%81431276378%';");
  console.log('Results in products table:', JSON.stringify(rokokTable.rows, null, 2));

  const totalInTable = await client.execute("SELECT count(*) as total FROM products;");
  console.log('Total rows in products table:', totalInTable.rows[0].total);

  const allNames = await client.execute("SELECT id, name, sku FROM products ORDER BY rowid DESC LIMIT 5;");
  console.log('Top 5 newest rows in products table:', JSON.stringify(allNames.rows, null, 2));
}

check().catch(console.error);
