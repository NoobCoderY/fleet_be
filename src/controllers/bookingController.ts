import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking';
import Vehicle from '../models/Vehicle';
import { CreateBookingRequest, CancelBookingParams } from '../models/types';

/**
 * Create a new booking with proper conflict checking
 */
export const createBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookingData: CreateBookingRequest = req.body;

    const vehicle = await Vehicle.findById(bookingData.vehicleId);
    if (!vehicle) {
      res.status(404).json({
        error: 'Vehicle not found',
        message: 'The specified vehicle ID does not exist',
      });
      return;
    }

    const fromPin = parseInt(bookingData.fromPincode);
    const toPin = parseInt(bookingData.toPincode);
    const estimatedRideDurationHours = Math.abs(fromPin - toPin) % 24;

    const startTime = new Date(bookingData.startTime);
    const endTime = new Date(
      startTime.getTime() + estimatedRideDurationHours * 60 * 60 * 1000
    );

    const conflictingBooking = await Booking.findOne({
      vehicleId: bookingData.vehicleId,
      status: 'confirmed',
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    });

    if (conflictingBooking) {
      res.status(409).json({
        error: 'Vehicle not available',
        message: 'The vehicle is already booked for an overlapping time slot',
      });
      return;
    }

    const estimatedCost =
      Math.round((200 + estimatedRideDurationHours * 50) * 100) / 100;

    const booking = new Booking({
      ...bookingData,
      startTime,
      endTime,
      estimatedRideDurationHours,
      estimatedCost,
      status: 'confirmed',
      distance: {
        text: `${Math.abs(fromPin - toPin)} pincode units`,
        value: Math.abs(fromPin - toPin),
      },
      duration: {
        text: `${Math.round(estimatedRideDurationHours * 60)} min`,
        value: estimatedRideDurationHours * 3600,
      },
    });

    const savedBooking = await booking.save();
    res.status(201).json(savedBooking);
  } catch (error) {
    console.error('Error creating booking:', error);

    if (error instanceof Error) {
      res.status(400).json({
        error: 'Failed to create booking',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      });
    }
  }
};

export const getBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { customerId } = req.query as { customerId?: string };

    if (!customerId) {
      res.status(400).json({
        error: 'Missing parameter',
        message: 'customerId query parameter is required',
      });
      return;
    }

    const bookings = await Booking.find({ customerId }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while fetching bookings',
    });
  }
};

export const getAllBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const { fromPincode, toPincode, status, customerId } = req.query as {
      fromPincode?: string;
      toPincode?: string;
      status?: string;
      customerId?: string;
    };

    if (page < 1) {
      res.status(400).json({
        error: 'Invalid parameter',
        message: 'Page number must be greater than 0',
      });
      return;
    }

    if (limit < 1 || limit > 100) {
      res.status(400).json({
        error: 'Invalid parameter',
        message: 'Limit must be between 1 and 100',
      });
      return;
    }

    const pincodeRegex = /^\d{6}$/;
    if (fromPincode && !pincodeRegex.test(fromPincode)) {
      res.status(400).json({
        error: 'Invalid parameter',
        message: 'From pincode must be 6 digits',
      });
      return;
    }

    if (toPincode && !pincodeRegex.test(toPincode)) {
      res.status(400).json({
        error: 'Invalid parameter',
        message: 'To pincode must be 6 digits',
      });
      return;
    }

    if (status && !['confirmed', 'cancelled', 'completed'].includes(status)) {
      res.status(400).json({
        error: 'Invalid parameter',
        message: 'Status must be one of: confirmed, cancelled, completed',
      });
      return;
    }

    const searchFilter: any = {};

    if (fromPincode) {
      searchFilter.fromPincode = fromPincode;
    }

    if (toPincode) {
      searchFilter.toPincode = toPincode;
    }

    if (status) {
      searchFilter.status = status;
    }

    if (customerId) {
      searchFilter.customerId = customerId;
    }

    const total = await Booking.countDocuments(searchFilter);
    const totalPages = Math.ceil(total / limit);

    const bookings = await Booking.find(searchFilter)
      .populate('vehicleId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const paginationData = {
      bookings,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      searchFilters: {
        fromPincode: fromPincode || null,
        toPincode: toPincode || null,
        status: status || null,
        customerId: customerId || null,
      },
    };

    res.json(paginationData);
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while fetching bookings',
    });
  }
};

export const cancelBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: 'Missing parameter',
        message: 'Booking ID is required',
      });
      return;
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      res.status(404).json({
        error: 'Booking not found',
        message: 'The specified booking ID does not exist',
      });
      return;
    }

    if (booking.status === 'cancelled') {
      res.status(400).json({
        error: 'Booking already cancelled',
        message: 'This booking has already been cancelled',
      });
      return;
    }

    if (booking.status === 'completed') {
      res.status(400).json({
        error: 'Cannot cancel completed booking',
        message:
          'This booking has already been completed and cannot be cancelled',
      });
      return;
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while cancelling the booking',
    });
  }
};
