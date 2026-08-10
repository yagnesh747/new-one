import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

class DatabaseService {
  private pgPool: Pool | null = null;
  private pglite: PGlite | null = null;
  private isPGliteMode = false;
  private isInitialized = false;

  public async getClient() {
    await this.init();
    if (!this.isPGliteMode && this.pgPool) {
      const client = await this.pgPool.connect();
      return {
        query: async (text: string, params?: any[]): Promise<QueryResult> => {
          const res = await client.query(text, params);
          return { rows: res.rows, rowCount: res.rowCount ?? 0 };
        },
        release: () => client.release(),
      };
    } else if (this.pglite) {
      return {
        query: async (text: string, params?: any[]): Promise<QueryResult> => {
          const res = await this.pglite!.query(text, params);
          return { rows: res.rows as any[], rowCount: res.affectedRows ?? res.rows.length };
        },
        release: () => {},
      };
    }
    throw new Error('Database service not available');
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    const connectionString = process.env.DATABASE_URL;

    // Try PG Pool first
    try {
      const testPool = new Pool({
        connectionString,
        connectionTimeoutMillis: 2000,
      });

      // Quick test query
      const client = await testPool.connect();
      await client.query('SELECT 1');
      client.release();

      this.pgPool = testPool;
      this.isPGliteMode = false;
      this.isInitialized = true;
      console.log('Connected to PostgreSQL server via pg Pool.');
      return;
    } catch (err: any) {
      console.log('Local PostgreSQL server connection not available. Initializing embedded PostgreSQL engine (PGlite)...');
    }

    // Fallback to PGlite
    try {
      const dataDir = path.join(__dirname, '../../.pgdata');
      this.pglite = new PGlite(dataDir);
      this.isPGliteMode = true;
      this.isInitialized = true;
      console.log('Embedded PostgreSQL engine (PGlite) initialized successfully.');

      // Auto-run schema setup if needed
      await this.bootstrapSchema();
    } catch (err) {
      console.error('Failed to initialize database engine:', err);
      throw err;
    }
  }

  public async bootstrapSchema(): Promise<void> {
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      if (this.isPGliteMode && this.pglite) {
        await this.pglite.exec(schemaSql);
      } else if (this.pgPool) {
        await this.pgPool.query(schemaSql);
      }
      console.log('Database schema verified/executed.');
    }
  }

  public async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    await this.init();

    if (!this.isPGliteMode && this.pgPool) {
      const res = await this.pgPool.query(text, params);
      return { rows: res.rows, rowCount: res.rowCount ?? 0 };
    } else if (this.pglite) {
      // PGlite compatibility query execution
      if (!params || params.length === 0) {
        // If text contains multiple SQL statements without params, use exec
        if (text.includes(';') && text.trim().split(';').filter((s) => s.trim().length > 0).length > 1) {
          await this.pglite.exec(text);
          return { rows: [], rowCount: 0 };
        }
      }
      const res = await this.pglite.query<T>(text, params);
      return {
        rows: res.rows,
        rowCount: res.affectedRows ?? res.rows.length,
      };
    }
    throw new Error('Database service not connected.');
  }

  public async transaction<T>(callback: (client: { query: (text: string, params?: any[]) => Promise<QueryResult> }) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const db = new DatabaseService();
