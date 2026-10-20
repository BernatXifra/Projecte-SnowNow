import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SkierSession } from '../models/SkierSession.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

// Coordenades reals de l'estació de Baqueira Beret (Val d'Aran)
// Longitud ~ 0.93° E, Latitud ~ 42.70° N
const sampleSessions = [
  {
    skierId: 'skier_001',
    skierName: 'Marc Soler',
    resortId: 'baqueira-beret',
    resortName: 'Baqueira Beret',
    date: new Date(),
    startTime: new Date(Date.now() - 3600 * 1000 * 2), // fa 2 hores
    endTime: new Date(Date.now() - 3600 * 1000 * 1),
    durationSeconds: 3600,
    totalDistanceMeters: 14850,
    topSpeedKmh: 82.4,
    avgSpeedKmh: 34.2,
    verticalDropMeters: 2150,
    startLocation: {
      type: 'Point',
      coordinates: [0.9325, 42.6985],
    },
    trajectory: {
      type: 'LineString',
      coordinates: [
        [0.9325, 42.6985],
        [0.9341, 42.6998],
        [0.9365, 42.7021],
        [0.9392, 42.7045],
        [0.9421, 42.7068],
      ],
    },
    trackPoints: [
      {
        location: { type: 'Point', coordinates: [0.9325, 42.6985] },
        timestamp: new Date(Date.now() - 3600 * 1000 * 2),
        altitudeMeters: 2500,
        speedKmh: 25.1,
      },
      {
        location: { type: 'Point', coordinates: [0.9365, 42.7021] },
        timestamp: new Date(Date.now() - 3600 * 1000 * 1.5),
        altitudeMeters: 2100,
        speedKmh: 82.4, // Velocitat punta
      },
      {
        location: { type: 'Point', coordinates: [0.9421, 42.7068] },
        timestamp: new Date(Date.now() - 3600 * 1000 * 1),
        altitudeMeters: 1800,
        speedKmh: 42.0,
      },
    ],
    status: 'completed',
  },
  {
    skierId: 'skier_002',
    skierName: 'Laia Puig',
    resortId: 'baqueira-beret',
    resortName: 'Baqueira Beret',
    date: new Date(),
    startTime: new Date(Date.now() - 3600 * 1000 * 3),
    endTime: new Date(Date.now() - 3600 * 1000 * 1.5),
    durationSeconds: 5400,
    totalDistanceMeters: 22400,
    topSpeedKmh: 74.8,
    avgSpeedKmh: 31.6,
    verticalDropMeters: 3100,
    startLocation: {
      type: 'Point',
      coordinates: [0.9331, 42.7002],
    },
    trajectory: {
      type: 'LineString',
      coordinates: [
        [0.9331, 42.7002],
        [0.9355, 42.7019],
        [0.9378, 42.7038],
        [0.9412, 42.7059],
      ],
    },
    trackPoints: [
      {
        location: { type: 'Point', coordinates: [0.9331, 42.7002] },
        timestamp: new Date(Date.now() - 3600 * 1000 * 3),
        altitudeMeters: 2450,
        speedKmh: 28.5,
      },
      {
        location: { type: 'Point', coordinates: [0.9412, 42.7059] },
        timestamp: new Date(Date.now() - 3600 * 1000 * 1.5),
        altitudeMeters: 1750,
        speedKmh: 74.8,
      },
    ],
    status: 'completed',
  },
  {
    skierId: 'skier_003',
    skierName: 'Jordi Altimira',
    resortId: 'baqueira-beret',
    resortName: 'Baqueira Beret',
    date: new Date(),
    startTime: new Date(Date.now() - 3600 * 1000 * 1.8),
    endTime: new Date(Date.now() - 3600 * 1000 * 0.5),
    durationSeconds: 4680,
    totalDistanceMeters: 18900,
    topSpeedKmh: 91.2, // Rècord de velocitat del dia
    avgSpeedKmh: 38.5,
    verticalDropMeters: 2600,
    startLocation: {
      type: 'Point',
      coordinates: [0.9318, 42.6974],
    },
    trajectory: {
      type: 'LineString',
      coordinates: [
        [0.9318, 42.6974],
        [0.9339, 42.6991],
        [0.9371, 42.7028],
        [0.9435, 42.7082],
      ],
    },
    trackPoints: [
      {
        location: { type: 'Point', coordinates: [0.9318, 42.6974] },
        timestamp: new Date(Date.now() - 3600 * 1000 * 1.8),
        altitudeMeters: 2510,
        speedKmh: 30.0,
      },
      {
        location: { type: 'Point', coordinates: [0.9371, 42.7028] },
        timestamp: new Date(Date.now() - 3600 * 1000 * 1.2),
        altitudeMeters: 2050,
        speedKmh: 91.2,
      },
      {
        location: { type: 'Point', coordinates: [0.9435, 42.7082] },
        timestamp: new Date(Date.now() - 3600 * 1000 * 0.5),
        altitudeMeters: 1600,
        speedKmh: 35.0,
      },
    ],
    status: 'completed',
  },
  {
    skierId: 'skier_004',
    skierName: 'Clara Font',
    resortId: 'grandvalira',
    resortName: 'Grandvalira',
    date: new Date(),
    startTime: new Date(Date.now() - 3600 * 1000 * 2.5),
    endTime: new Date(Date.now() - 3600 * 1000 * 1),
    durationSeconds: 5400,
    totalDistanceMeters: 28100, // Màxima distància
    topSpeedKmh: 68.3,
    avgSpeedKmh: 30.1,
    verticalDropMeters: 3800,
    startLocation: {
      type: 'Point',
      coordinates: [1.7335, 42.5562], // Grandvalira (Andorra)
    },
    trajectory: {
      type: 'LineString',
      coordinates: [
        [1.7335, 42.5562],
        [1.7368, 42.5591],
        [1.7412, 42.5623],
        [1.7456, 42.5658],
      ],
    },
    trackPoints: [
      {
        location: { type: 'Point', coordinates: [1.7335, 42.5562] },
        timestamp: new Date(Date.now() - 3600 * 1000 * 2.5),
        altitudeMeters: 2560,
        speedKmh: 24.0,
      },
      {
        location: { type: 'Point', coordinates: [1.7456, 42.5658] },
        timestamp: new Date(Date.now() - 3600 * 1000 * 1),
        altitudeMeters: 1710,
        speedKmh: 68.3,
      },
    ],
    status: 'completed',
  },
];

async function seed() {
  try {
    console.log('🔄 Connectant a MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connectat correctament!');

    console.log('🗑️ Netejant dades de prova anteriors de skier_sessions...');
    await SkierSession.deleteMany({});

    console.log('📦 Inserint noves sessions de prova amb telemetria i GeoJSON...');
    const inserted = await SkierSession.insertMany(sampleSessions);
    console.log(`✅ S'han inserit ${inserted.length} sessions d'esquí amb èxit!`);

    console.log('🗺️ Sincronitzant índexs geoespacials 2dsphere...');
    await SkierSession.syncIndexes();
    console.log('✅ Índexs 2dsphere creats i sincronitzats a MongoDB Atlas!');

    await mongoose.disconnect();
    console.log('👋 Connexió tancada.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error durant el seeding:', error.message);
    process.exit(1);
  }
}

seed();
