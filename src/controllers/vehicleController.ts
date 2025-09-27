import { Request, Response } from 'express';
import Vehicle from '../models/Vehicle';
import Booking from '../models/Booking';
import { CreateVehicleRequest, SearchVehiclesQuery } from '../models/types';

/**
 * Create a new vehicle
 */
export const createVehicle = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const vehicleData: CreateVehicleRequest = req.body;
    const vehicle = new Vehicle(vehicleData);
    const savedVehicle = await vehicle.save();
    res.status(201).json(savedVehicle);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        error: 'Failed to create vehicle',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred while creating the vehicle',
      });
    }
  }
};

/**
 * Get all vehicles
 */
export const getVehicles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while fetching vehicles',
    });
  }
};

/**
 * Find available vehicles based on capacity, route, and time
 */
export const findAvailableVehicles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query: SearchVehiclesQuery =
      req.query as unknown as SearchVehiclesQuery;

    if (
      !query.capacityRequired ||
      !query.fromPincode ||
      !query.toPincode ||
      !query.startTime
    ) {
      res.status(400).json({
        error: 'Missing required parameters',
        message:
          'capacityRequired, fromPincode, toPincode, and startTime are required',
      });
      return;
    }

    const requiredCapacity = parseInt(query.capacityRequired);
    const fromPin = parseInt(query.fromPincode);
    const toPin = parseInt(query.toPincode);
    const startTime = new Date(query.startTime);

    const estimatedRideDurationHours = Math.abs(fromPin - toPin) % 24;

    const endTime = new Date(
      startTime.getTime() + estimatedRideDurationHours * 60 * 60 * 1000
    );

    const capacityFilter = { capacityKg: { $gte: requiredCapacity } };

    const totalVehiclesWithCapacity = await Vehicle.countDocuments(
      capacityFilter
    );

    const overlappingBookings = await Booking.find({
      status: 'confirmed',
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    }).select('vehicleId startTime endTime');

    const bookedVehicleIds = overlappingBookings.map(
      (booking: any) => booking.vehicleId
    );

    const searchCriteria = {
      ...capacityFilter,
      _id: { $nin: bookedVehicleIds },
    };

    const availableVehicles = await Vehicle.find(searchCriteria).sort({
      createdAt: -1,
    });

    // Add estimated ride duration to each vehicle
    const vehiclesWithEstimates = availableVehicles.map((vehicle) => {
      const vehicleObj = vehicle.toObject() as any;
      vehicleObj.estimatedRideDurationHours = estimatedRideDurationHours;
      return vehicleObj;
    });

    res.json(vehiclesWithEstimates);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        error: 'Failed to search vehicles',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred while searching for vehicles',
      });
    }
  }
};
