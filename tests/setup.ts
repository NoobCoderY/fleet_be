import mongoose from 'mongoose';

beforeAll(async () => {
  // Close any existing connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  // Connect to a test database
  const mongoUrl =
    process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/fleetlink_test';
  await mongoose.connect(mongoUrl);
});

beforeEach(async () => {
  // Clean up database before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    if (collection) {
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  // Clean up database and close connection
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    if (collection) {
      await collection.deleteMany({});
    }
  }
  await mongoose.connection.close();
});
