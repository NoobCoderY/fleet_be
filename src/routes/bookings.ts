import { Router } from 'express';
import {
  createBooking,
  getBookings,
  getAllBookings,
  cancelBooking,
} from '../controllers/bookingController';
import { validateBody } from '../middleware/validation';
import { createBookingSchema } from '../validation/schemas';

const router = Router();

/**
 * GET /api/bookings/all
 * Get all bookings (admin endpoint)
 */
router.get('/all', getAllBookings);



/**
 * GET /api/bookings
 * Get bookings for a customer
 */
router.get('/', getBookings);

/**
 * POST /api/bookings
 * Create a new booking
 */
router.post('/', validateBody(createBookingSchema), createBooking);


/**
 * DELETE /api/bookings/:id
 * Cancel a booking
 */
router.delete('/:id', cancelBooking);

export default router;
