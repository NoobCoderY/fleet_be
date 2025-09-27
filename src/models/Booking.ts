import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  vehicleId: mongoose.Types.ObjectId;
  customerId: string;
  fromPincode: string;
  toPincode: string;
  startTime: Date;
  endTime: Date;
  estimatedRideDurationHours: number;
  estimatedCost?: number;
  distance?: {
    text: string;
    value: number;
  };
  duration?: {
    text: string;
    value: number;
  };
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
    },
    customerId: {
      type: String,
      required: [true, 'Customer ID is required'],
      trim: true,
    },
    fromPincode: {
      type: String,
      required: [true, 'From pincode is required'],
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be 6 digits'],
    },
    toPincode: {
      type: String,
      required: [true, 'To pincode is required'],
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be 6 digits'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    estimatedRideDurationHours: {
      type: Number,
      required: [true, 'Estimated ride duration is required'],
      min: [0, 'Duration cannot be negative'],
    },
    estimatedCost: {
      type: Number,
      min: [0, 'Cost cannot be negative'],
    },
    distance: {
      text: String,
      value: Number,
    },
    duration: {
      text: String,
      value: Number,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'completed'],
      default: 'confirmed',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
bookingSchema.index({ vehicleId: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ startTime: 1, endTime: 1 });
bookingSchema.index({ customerId: 1 });

const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
export default Booking;
