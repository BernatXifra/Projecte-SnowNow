import mongoose, { Document, Schema } from 'mongoose';

// Punt de registre individual a la trajectòria
export interface ITrackPoint {
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitud, latitud] -> Format estàndard GeoJSON
  };
  timestamp: Date;
  altitudeMeters?: number;
  speedKmh?: number;
}

export interface ISkierSession extends Document {
  skierId: string;
  skierName: string;
  resortId: string;
  resortName: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  totalDistanceMeters: number;
  topSpeedKmh: number;
  avgSpeedKmh: number;
  verticalDropMeters: number;
  // Trajectòria completa GeoJSON LineString per a consultes $geoIntersects / $geoWithin
  trajectory: {
    type: 'LineString';
    coordinates: [number, number][]; // Llista de punts [longitud, latitud]
  };
  // Punt d'inici en format Point per a consultes de proximitat $near
  startLocation: {
    type: 'Point';
    coordinates: [number, number]; // [longitud, latitud]
  };
  // Punts detallats de telemetria al llarg del recorregut
  trackPoints: ITrackPoint[];
  status: 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const PointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
      validate: {
        validator: function (v: number[]) {
          return (
            v.length === 2 &&
            v[0] >= -180 &&
            v[0] <= 180 && // Longitud
            v[1] >= -90 &&
            v[1] <= 90 // Latitud
          );
        },
        message: 'Les coordenades han de ser [longitud (-180 a 180), latitud (-90 a 90)]',
      },
    },
  },
  { _id: false }
);

const LineStringSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['LineString'],
      required: true,
      default: 'LineString',
    },
    coordinates: {
      type: [[Number]], // Array de [lng, lat]
      required: true,
    },
  },
  { _id: false }
);

const TrackPointSchema = new Schema(
  {
    location: {
      type: PointSchema,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    altitudeMeters: {
      type: Number,
    },
    speedKmh: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

const SkierSessionSchema = new Schema<ISkierSession>(
  {
    skierId: {
      type: String,
      required: true,
      index: true,
    },
    skierName: {
      type: String,
      required: true,
    },
    resortId: {
      type: String,
      required: true,
      index: true,
    },
    resortName: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date(),
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    endTime: {
      type: Date,
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDistanceMeters: {
      type: Number,
      default: 0,
      min: 0,
    },
    topSpeedKmh: {
      type: Number,
      default: 0,
      min: 0,
    },
    avgSpeedKmh: {
      type: Number,
      default: 0,
      min: 0,
    },
    verticalDropMeters: {
      type: Number,
      default: 0,
      min: 0,
    },
    trajectory: {
      type: LineStringSchema,
      required: true,
    },
    startLocation: {
      type: PointSchema,
      required: true,
    },
    trackPoints: [TrackPointSchema],
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'completed',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'skier_sessions',
  }
);

// ÍNDEXS GEOESPACIALS CLAU PER A SGBD
// 1. Índex 2dsphere per al punt inicial (permet consultes $near i $geoWithin)
SkierSessionSchema.index({ startLocation: '2dsphere' });

// 2. Índex 2dsphere per a la trajectòria LineString (permet $geoIntersects amb pistes o polígons)
SkierSessionSchema.index({ trajectory: '2dsphere' });

// 3. Índex compost per agilitzar el càlcul del leaderboard per estació i data
SkierSessionSchema.index({ resortId: 1, date: -1, topSpeedKmh: -1 });
SkierSessionSchema.index({ resortId: 1, date: -1, totalDistanceMeters: -1 });

export const SkierSession = mongoose.model<ISkierSession>('SkierSession', SkierSessionSchema);
