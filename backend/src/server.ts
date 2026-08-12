import app from './app';
import { pool } from './config/db';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await pool.query('SELECT NOW()');
    console.log('PostgreSQL Database connection established successfully.');
  } catch (error: any) {
    console.warn('PostgreSQL DB connection unavailable. Operating backend with built-in memory fallback store.');
  }

  app.listen(PORT, () => {
    console.log(`Stockly Backend API running on http://localhost:${PORT}`);
  });
}

startServer();
