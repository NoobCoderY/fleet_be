import { Router } from 'express';
import {
  createVehicle,
  getVehicles,
  findAvailableVehicles,
} from '../controllers/vehicleController';
import { validateBody, validateQuery } from '../middleware/validation';
import {
  createVehicleSchema,
  searchVehiclesSchema,
} from '../validation/schemas';

const router = Router();

/**
 * POST /api/vehicles
 * Create a new vehicle
 */
router.post('/', validateBody(createVehicleSchema), createVehicle);

/**
 * GET /api/vehicles
 * Get all vehicles
 */
router.get('/', getVehicles);

/**
 * GET /api/vehicles/available
 * Find available vehicles based on capacity, route, and time
 */
router.get(
  '/available',
  validateQuery(searchVehiclesSchema),
  findAvailableVehicles
);


export default router;
