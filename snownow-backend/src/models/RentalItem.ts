import mongoose, { Schema } from 'mongoose';

export const rentalMeasurements = {
  skis: 'heightCm',
  snowboard: 'weightKg',
  boots: 'footLengthCm',
  helmet: 'headCircumferenceCm',
} as const;

export type RentalCategory = keyof typeof rentalMeasurements;

export interface RentalReservation {
  _id: string;
  skierId: string;
  measurement: number;
  startDate: Date;
  endDate: Date;
  status: 'confirmed' | 'cancelled';
  createdAt: Date;
}

interface RentalItem {
  resortId: string;
  name: string;
  category: RentalCategory;
  fit: { min: number; max: number };
  attributes: Record<string, unknown>;
  reservations: RentalReservation[];
}

const positiveNumber = {
  type: Number,
  required: true,
  validate: (value: number) => Number.isFinite(value) && value > 0,
} as const;

const fitSchema = new Schema<RentalItem['fit']>({
  min: positiveNumber,
  max: positiveNumber,
}, { _id: false });

fitSchema.path('max').validate(function (this: RentalItem['fit'], value: number) {
  return value >= this.min;
}, 'El màxim de talla ha de ser igual o superior al mínim.');

const reservationSchema = new Schema<RentalReservation>({
  _id: { type: String, required: true },
  skierId: { type: String, required: true },
  measurement: positiveNumber,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled'], required: true },
  createdAt: { type: Date, required: true },
});

const rentalItemSchema = new Schema<RentalItem>({
  resortId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: Object.keys(rentalMeasurements), required: true },
  fit: { type: fitSchema, required: true },
  attributes: { type: Schema.Types.Mixed, default: () => ({}) },
  reservations: { type: [reservationSchema], default: [] },
}, {
  timestamps: true,
  collection: 'rental_inventory',
  minimize: false,
});

rentalItemSchema.index({ resortId: 1, category: 1, _id: 1 });
rentalItemSchema.index({ 'reservations._id': 1 }, {
  unique: true,
  partialFilterExpression: { 'reservations._id': { $exists: true } },
});

export const RentalItem = mongoose.model<RentalItem>('RentalItem', rentalItemSchema);
