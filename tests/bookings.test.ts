import request from 'supertest';
import app from '../src/app';
import Vehicle from '../src/models/Vehicle';
import Booking from '../src/models/Booking';

describe('Booking API', () => {
  let vehicle: any;

  beforeEach(async () => {
    vehicle = await Vehicle.create({
      name: 'Test Truck',
      capacityKg: 5000,
      tyres: 6,
    });
  });

  describe('POST /api/bookings - Success and Conflict Scenarios', () => {
    test('should successfully create booking for available vehicle', async () => {
      const bookingData = {
        vehicleId: vehicle._id.toString(),
        fromPincode: '110001',
        toPincode: '110010',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        customerId: 'customer123',
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      expect(response.body).toMatchObject({
        vehicleId: vehicle._id.toString(),
        fromPincode: bookingData.fromPincode,
        toPincode: bookingData.toPincode,
        customerId: bookingData.customerId,
        status: 'confirmed',
      });
      expect(response.body.estimatedRideDurationHours).toBe(9);
    });

    test('should prevent exact time overlap booking conflict', async () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

    
      const firstBooking = {
        vehicleId: vehicle._id.toString(),
        fromPincode: '110001',
        toPincode: '110010',
        startTime: startTime.toISOString(),
        customerId: 'customer1',
      };

      await request(app).post('/api/bookings').send(firstBooking).expect(201);

     
      const conflictingBooking = {
        vehicleId: vehicle._id.toString(),
        fromPincode: '110020',
        toPincode: '110025',
        startTime: startTime.toISOString(),
        customerId: 'customer2',
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(conflictingBooking)
        .expect(409);

      expect(response.body).toMatchObject({
        error: 'Vehicle not available',
        message: 'The vehicle is already booked for an overlapping time slot',
      });
    });

    test('should prevent partial overlap booking conflict (start during existing booking)', async () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

    
      const firstBooking = {
        vehicleId: vehicle._id.toString(),
        fromPincode: '110001',
        toPincode: '110003',
        startTime: startTime.toISOString(),
        customerId: 'customer1',
      };

      await request(app).post('/api/bookings').send(firstBooking).expect(201);

      // Try to book starting 1 hour after first booking starts (overlaps)
      const overlappingBooking = {
        vehicleId: vehicle._id.toString(),
        fromPincode: '110010',
        toPincode: '110015',
        startTime: new Date(startTime.getTime() + 60 * 60 * 1000).toISOString(),
        customerId: 'customer2',
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(overlappingBooking)
        .expect(409);

      expect(response.body.error).toBe('Vehicle not available');
    });

    test('should prevent engulfing booking conflict (booking that wraps around existing)', async () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // First booking: short duration (1 hour)
      const firstBooking = {
        vehicleId: vehicle._id.toString(),
        fromPincode: '110001',
        toPincode: '110002',
        startTime: new Date(startTime.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour after base time
        customerId: 'customer1',
      };

      await request(app).post('/api/bookings').send(firstBooking).expect(201);

      // Try to book that starts before and ends after the existing booking
      // 9 hour duration
      const engulfingBooking = {
        vehicleId: vehicle._id.toString(),
        fromPincode: '110001',
        toPincode: '110010',
        startTime: startTime.toISOString(),
        customerId: 'customer2',
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(engulfingBooking)
        .expect(409);

      expect(response.body.error).toBe('Vehicle not available');
    });

    test('should allow sequential bookings without overlap', async () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // First booking: 2 hours duration
      const firstBooking = {
        vehicleId: vehicle._id.toString(),
        fromPincode: '110001',
        toPincode: '110003',
        startTime: startTime.toISOString(),
        customerId: 'customer1',
      };

      await request(app).post('/api/bookings').send(firstBooking).expect(201);


      const sequentialBooking = {
        vehicleId: vehicle._id.toString(),
        fromPincode: '110010',
        toPincode: '110013',
        startTime: new Date(
          startTime.getTime() + 2 * 60 * 60 * 1000
        ).toISOString(),
        customerId: 'customer2',
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(sequentialBooking)
        .expect(201);

      expect(response.body.status).toBe('confirmed');
    });

    test('should reject booking for non-existent vehicle', async () => {
      const bookingData = {
        vehicleId: '507f1f77bcf86cd799439011',
        fromPincode: '110001',
        toPincode: '110010',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        customerId: 'customer123',
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Vehicle not found',
        message: 'The specified vehicle ID does not exist',
      });
    });
  });
});
