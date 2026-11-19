import mongoose, { Document, Schema } from 'mongoose';

export interface IResort extends Document {
  name: string;
  country: string;
  region: string;
  description: string;
  skiAreaKm: number;
  altitudeMeters: {
    base: number;
    summit: number;
  };
  services: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ResortSchema = new Schema<IResort>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    region: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    skiAreaKm: {
      type: Number,
      required: true,
      min: 0,
    },
    altitudeMeters: {
      base: {
        type: Number,
        required: true,
        min: 0,
      },
      summit: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    services: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'resorts',
  }
);

ResortSchema.index({
  name: 'text',
  country: 'text',
  region: 'text',
  description: 'text',
  services: 'text',
});

export const Resort = mongoose.model<IResort>('Resort', ResortSchema);
