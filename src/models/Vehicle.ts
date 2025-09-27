import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicle extends Document {
  name: string;
  capacityKg: number;
  tyres: number;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    name: {
      type: String,
      required: [true, 'Vehicle name is required'],
      trim: true,
      maxlength: [100, 'Vehicle name cannot exceed 100 characters'],
    },
    capacityKg: {
      type: Number,
      required: [true, 'Vehicle capacity is required'],
      min: [1, 'Capacity must be at least 1 kg'],
      max: [50000, 'Capacity cannot exceed 50,000 kg'],
    },
    tyres: {
      type: Number,
      required: [true, 'Number of tyres is required'],
      min: [2, 'Vehicle must have at least 2 tyres'],
      max: [32, 'Vehicle cannot have more than 32 tyres'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for performance
vehicleSchema.index({ capacityKg: 1 });

const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema);
export default Vehicle;
