import { createHash } from 'node:crypto';
import dotenv from 'dotenv';
import mongoose, { Types } from 'mongoose';
import { RentalItem } from '../models/RentalItem.js';
import type { RentalCategory } from '../models/RentalItem.js';
import { Resort } from '../models/Resort.js';

dotenv.config();

const pieces = [
  { code: 'skis-150', category: 'skis', name: 'Esquís de prova 150 cm', fit: { min: 145, max: 170 }, attributes: { brand: 'Demo', model: 'Pista 150', lengthCm: 150 } },
  { code: 'skis-165', category: 'skis', name: 'Esquís de prova 165 cm', fit: { min: 170, max: 195 }, attributes: { brand: 'Demo', model: 'Pista 165', lengthCm: 165 } },
  { code: 'snowboard-145', category: 'snowboard', name: 'Taula de prova 145 cm', fit: { min: 45, max: 70 }, attributes: { brand: 'Demo', model: 'Neu 145', lengthCm: 145 } },
  { code: 'snowboard-155', category: 'snowboard', name: 'Taula de prova 155 cm', fit: { min: 65, max: 95 }, attributes: { brand: 'Demo', model: 'Neu 155', lengthCm: 155 } },
  { code: 'boots-39', category: 'boots', name: 'Botes de prova EU 39', fit: { min: 24, max: 25 }, attributes: { brand: 'Demo', model: 'Cim 39', sizeEU: 39 } },
  { code: 'boots-43', category: 'boots', name: 'Botes de prova EU 43', fit: { min: 27, max: 28 }, attributes: { brand: 'Demo', model: 'Cim 43', sizeEU: 43 } },
  { code: 'helmet-s', category: 'helmet', name: 'Casc de prova S', fit: { min: 51, max: 55 }, attributes: { brand: 'Demo', model: 'Alp S', size: 'S' } },
  { code: 'helmet-m', category: 'helmet', name: 'Casc de prova M', fit: { min: 55, max: 59 }, attributes: { brand: 'Demo', model: 'Alp M', size: 'M' } },
] satisfies {
  code: string;
  category: RentalCategory;
  name: string;
  fit: { min: number; max: number };
  attributes: { brand: string; model: string } & Record<string, unknown>;
}[];

async function seedRentalInventory() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('Cal configurar MONGO_URI.');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000, autoCreate: false, autoIndex: false });
  const resorts = await Resort.find({}, { name: 1 }).sort({ name: 1 }).lean();
  if (resorts.length === 0) throw new Error('La base de dades no té cap estació. Crea les estacions abans de carregar el material.');

  const now = new Date();
  for (const resort of resorts) {
    const resortId = resort._id.toString();
    const result = await RentalItem.bulkWrite(pieces.map(({ code, ...piece }) => {
      // El mateix codi d'inventari de prova genera el mateix _id per a cada estació.
      const id = createHash('sha256').update(`rental-seed:${resortId}:${code}`).digest('hex').slice(0, 24);
      return {
        updateOne: {
          filter: { _id: new Types.ObjectId(id) },
          update: {
            $setOnInsert: { ...piece, resortId, reservations: [], createdAt: now, updatedAt: now },
          },
          upsert: true,
          timestamps: false,
        },
      };
    }));
    console.log(`${resort.name} (${resortId}) — ${result.upsertedCount} peces afegides, ${result.matchedCount} ja existents.`);
  }
}

seedRentalInventory()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error carregant el material de prova:', message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
