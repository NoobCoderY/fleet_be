import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import vehicleRoutes from './routes/vehicles';
import bookingRoutes from './routes/bookings';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';


dotenv.config();

const app = express();


if (process.env.NODE_ENV !== 'test') {
  connectDB();
}


app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}


app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'FleetLink Backend is running',
    timestamp: new Date().toISOString(),
  });
});


app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);


app.use(notFoundHandler);
app.use(errorHandler);


if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`FleetLink Backend Server running on port ${PORT}`);
  });
}

export default app;
