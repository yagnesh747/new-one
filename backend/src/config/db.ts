import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stockly';

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const getClient = async (): Promise<PoolClient> => {
  const client = await pool.connect();
  return client;
};
