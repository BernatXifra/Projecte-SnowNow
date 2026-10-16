import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || '';

app.use(cors());
app.use(express.json());

// Ruta de prova de salut
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'SnowNow API' });
});

// Connexió amb MongoDB Atlas
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(' Connectat correctament a MongoDB Atlas (SnowNow)');
    app.listen(PORT, () => {
      console.log(` Servidor backend escoltant al port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(' Error connectant a MongoDB Atlas:', err.message);
  });