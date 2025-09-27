import Joi from 'joi';

export const createVehicleSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Vehicle name is required',
    'string.max': 'Vehicle name cannot exceed 100 characters',
  }),
  capacityKg: Joi.number().integer().min(1).max(50000).required().messages({
    'number.base': 'Capacity must be a number',
    'number.min': 'Capacity must be at least 1 kg',
    'number.max': 'Capacity cannot exceed 50,000 kg',
  }),
  tyres: Joi.number().integer().min(2).max(32).required().messages({
    'number.base': 'Number of tyres must be a number',
    'number.min': 'Vehicle must have at least 2 tyres',
    'number.max': 'Vehicle cannot have more than 32 tyres',
  }),
});

export const searchVehiclesSchema = Joi.object({
  capacityRequired: Joi.number().integer().min(1).required().messages({
    'number.base': 'Capacity required must be a number',
    'number.min': 'Capacity required must be at least 1 kg',
  }),
  fromPincode: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'From pincode must be 6 digits',
    }),
  toPincode: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'To pincode must be 6 digits',
    }),
  startTime: Joi.date().iso().greater('now').required().messages({
    'date.base': 'Start time must be a valid date',
    'date.greater': 'Start time must be in the future',
  }),
});

export const createBookingSchema = Joi.object({
  vehicleId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Vehicle ID must be a valid MongoDB ObjectId',
    }),
  fromPincode: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'From pincode must be 6 digits',
    }),
  toPincode: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'To pincode must be 6 digits',
    }),
  startTime: Joi.date().iso().greater('now').required().messages({
    'date.base': 'Start time must be a valid date',
    'date.greater': 'Start time must be in the future',
  }),
  customerId: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Customer ID is required',
    'string.max': 'Customer ID cannot exceed 100 characters',
  }),
});
