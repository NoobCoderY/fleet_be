// Booking-related types
export interface CreateBookingRequest {
  vehicleId: string;
  fromPincode: string;
  toPincode: string;
  startTime: string;
  customerId: string;
}

export interface BookingResponse {
  _id: string;
  vehicleId: string;
  customerId: string;
  fromPincode: string;
  toPincode: string;
  startTime: Date;
  endTime: Date;
  estimatedRideDurationHours: number;
  distance?: {
    text: string;
    value: number; // in meters
  };
  estimatedCost?: number; // in INR
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CancelBookingParams {
  id: string;
}

export interface BookingListResponse {
  _id: string;
  vehicleId: string;
  vehicleName?: string;
  customerId: string;
  fromPincode: string;
  toPincode: string;
  startTime: Date;
  endTime: Date;
  estimatedRideDurationHours: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
