import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { apiRouter } from './routes/api.js';
import { initializeStore } from './store/dataStore.js';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

async function start() {
  const mongoUri = process.env.MONGO_URI?.trim();
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
      console.log('Connected to MongoDB.');
    } catch (err) {
      console.warn(
        `MongoDB connection failed (${err.message}). Falling back to in-memory store.`
      );
    }
  } else {
    console.log('MONGO_URI not configured. Running with seeded in-memory store.');
  }

  await initializeStore();

  app.listen(PORT, () => {
    console.log(`ParkTrack server listening on http://localhost:${PORT}`);
  });
}

start();

