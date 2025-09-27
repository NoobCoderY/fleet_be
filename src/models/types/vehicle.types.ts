// Vehicle-related types
export interface CreateVehicleRequest {
  name: string;
  capacityKg: number;
  tyres: number;
}

export interface SearchVehiclesQuery {
  capacityRequired: string;
  fromPincode: string;
  toPincode: string;
  startTime: string;
}

export interface VehicleResponse {
  _id: string;
  name: string;
  capacityKg: number;
  tyres: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleWithDuration extends VehicleResponse {
  estimatedRideDurationHours: number;
}
