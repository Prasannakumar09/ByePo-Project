const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./data/config/db');
const { notFound, errorHandler } = require('./data/middleware/errorHandler');
const { checkFlag } = require('./data/controller/flag.controller')

const authRoutes = require('./data/routes/auth.routes');
const orgRoutes = require('./data/routes/org.routes');
const flagRoutes = require('./data/routes/flag.routes');

// Fail fast if required env vars are missing — better than a cryptic runtime crash later
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'PORT'];
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
});

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/flags', flagRoutes);
app.post('/api/check', checkFlag);

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// These two must be registered LAST, after all routes
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT;
const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// Safety nets — log and shut down cleanly instead of an unexplained crash
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});