import request from 'supertest';
import app from '../src/app';
import Vehicle from '../src/models/Vehicle';

describe('Vehicle API', () => {
  beforeEach(async () => {

  });

  describe('POST /api/vehicles', () => {
    test('should create a new vehicle with valid data', async () => {
      const vehicleData = {
        name: 'Test Truck',
        capacityKg: 5000,
        tyres: 6,
      };

      const response = await request(app)
        .post('/api/vehicles')
        .send(vehicleData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: vehicleData.name,
        capacityKg: vehicleData.capacityKg,
        tyres: vehicleData.tyres,
      });
      expect(response.body._id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    test('should reject vehicle with missing required fields', async () => {
      const invalidData = {
        name: 'Test Truck',
      };

      const response = await request(app)
        .post('/api/vehicles')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('should reject vehicle with invalid capacity', async () => {
      const invalidData = {
        name: 'Test Truck',
        capacityKg: 0,
        tyres: 6,
      };

      const response = await request(app)
        .post('/api/vehicles')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/vehicles/available - Overlap Logic Tests', () => {
    let vehicle1: any, vehicle2: any, vehicle3: any;

    beforeEach(async () => {
      vehicle1 = await Vehicle.create({
        name: 'Small Truck',
        capacityKg: 1000,
        tyres: 4,
      });

      vehicle2 = await Vehicle.create({
        name: 'Medium Truck',
        capacityKg: 3000,
        tyres: 6,
      });

      vehicle3 = await Vehicle.create({
        name: 'Large Truck',
        capacityKg: 5000,
        tyres: 8,
      });
    });

    test('should return vehicles with sufficient capacity when no bookings exist', async () => {
      const searchParams = {
        capacityRequired: '2000',
        fromPincode: '110001',
        toPincode: '110010',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .get('/api/vehicles/available')
        .query(searchParams)
        .expect(200);

      expect(response.body).toHaveLength(2); 
      expect(response.body[0].estimatedRideDurationHours).toBe(9); // |110010 - 110001| % 24 = 9
    });

    test('should exclude vehicles with exact time overlap', async () => {
      const searchTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create booking for vehicle1 at exact search time
      await require('../src/models/Booking').default.create({
        vehicleId: vehicle1._id,
        customerId: 'customer1',
        fromPincode: '110001',
        toPincode: '110003',
        startTime: searchTime,
        endTime: new Date(searchTime.getTime() + 2 * 60 * 60 * 1000),
        estimatedRideDurationHours: 2,
        status: 'confirmed',
      });

      const searchParams = {
        capacityRequired: '500',
        fromPincode: '110001',
        toPincode: '110010',
        startTime: searchTime.toISOString(),
      };

      const response = await request(app)
        .get('/api/vehicles/available')
        .query(searchParams)
        .expect(200);

     
      expect(response.body).toHaveLength(2);
      expect(response.body.map((v: any) => v._id)).not.toContain(
        vehicle1._id.toString()
      );
    });

    test('should exclude vehicles with partial overlap (search starts during existing booking)', async () => {
      const bookingStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const searchStart = new Date(bookingStart.getTime() + 60 * 60 * 1000); // 1 hour after booking starts

 
      await require('../src/models/Booking').default.create({
        vehicleId: vehicle2._id,
        customerId: 'customer1',
        fromPincode: '110001',
        toPincode: '110005',
        startTime: bookingStart,
        endTime: new Date(bookingStart.getTime() + 4 * 60 * 60 * 1000),
        estimatedRideDurationHours: 4,
        status: 'confirmed',
      });

      const searchParams = {
        capacityRequired: '1000',
        fromPincode: '110001',
        toPincode: '110010', // 9 hour duration
        startTime: searchStart.toISOString(),
      };

      const response = await request(app)
        .get('/api/vehicles/available')
        .query(searchParams)
        .expect(200);

      // Should return vehicle1 and vehicle3, but not vehicle2 (has overlap)
      expect(response.body).toHaveLength(2);
      expect(response.body.map((v: any) => v._id)).not.toContain(
        vehicle2._id.toString()
      );
    });

    test('should exclude vehicles when search engulfs existing booking', async () => {
      const searchStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const bookingStart = new Date(searchStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours after search starts

      // Create short booking for vehicle3
      await require('../src/models/Booking').default.create({
        vehicleId: vehicle3._id,
        customerId: 'customer1',
        fromPincode: '110001',
        toPincode: '110002',
        startTime: bookingStart,
        endTime: new Date(bookingStart.getTime() + 1 * 60 * 60 * 1000),
        estimatedRideDurationHours: 1,
        status: 'confirmed',
      });

      const searchParams = {
        capacityRequired: '1000',
        fromPincode: '110001',
        toPincode: '110010', // 9 hour duration - engulfs the existing booking
        startTime: searchStart.toISOString(),
      };

      const response = await request(app)
        .get('/api/vehicles/available')
        .query(searchParams)
        .expect(200);

      // Should return vehicle1 and vehicle2, but not vehicle3 (engulfed)
      expect(response.body).toHaveLength(2);
      expect(response.body.map((v: any) => v._id)).not.toContain(
        vehicle3._id.toString()
      );
    });

    test('should include vehicles with non-overlapping bookings', async () => {
      const searchStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const bookingStart = new Date(
        searchStart.getTime() + 10 * 60 * 60 * 1000
      ); // 10 hours after search

      // Create booking that starts after search would end
      await require('../src/models/Booking').default.create({
        vehicleId: vehicle1._id,
        customerId: 'customer1',
        fromPincode: '110001',
        toPincode: '110005',
        startTime: bookingStart,
        endTime: new Date(bookingStart.getTime() + 4 * 60 * 60 * 1000),
        estimatedRideDurationHours: 4,
        status: 'confirmed',
      });

      const searchParams = {
        capacityRequired: '500',
        fromPincode: '110001',
        toPincode: '110010', // 9 hour duration
        startTime: searchStart.toISOString(),
      };

      const response = await request(app)
        .get('/api/vehicles/available')
        .query(searchParams)
        .expect(200);

      // Should return all vehicles since booking doesn't overlap
      expect(response.body).toHaveLength(3);
    });

    test('should only exclude vehicles with confirmed status bookings', async () => {
      const searchTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create cancelled booking for vehicle1
      await require('../src/models/Booking').default.create({
        vehicleId: vehicle1._id,
        customerId: 'customer1',
        fromPincode: '110001',
        toPincode: '110010',
        startTime: searchTime,
        endTime: new Date(searchTime.getTime() + 9 * 60 * 60 * 1000),
        estimatedRideDurationHours: 9,
        status: 'cancelled', // Not confirmed
      });

      const searchParams = {
        capacityRequired: '500',
        fromPincode: '110001',
        toPincode: '110010',
        startTime: searchTime.toISOString(),
      };

      const response = await request(app)
        .get('/api/vehicles/available')
        .query(searchParams)
        .expect(200);

      // Should return all vehicles since cancelled bookings don't count
      expect(response.body).toHaveLength(3);
    });

    test('should reject search with missing required parameters', async () => {
      const response = await request(app)
        .get('/api/vehicles/available')
        .query({
          capacityRequired: '1000',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});
