const express = require('express');
const app = express();
const path = require('path');

const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

const envFile = process.env.NODE_ENV === 'production' ? './prod.env' : './dev.env';
dotenv.config({ path: envFile });

const cors = require('cors');

app.use(cors({
  origin: process.env.CLIENT_DOMAIN,
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const errHandler = require("./utils/errHandler.js")
const AppError = require('./utils/AppError.js');

// Security middleware
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 8 * 60 * 1000, // 15 minutes
  max: 200 // limit each IP to 100 requests per windowMs
}));

const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.gpteng.co"],
    }
  }
}));

app.set('trust proxy', 1);

// API routes FIRST - before static files!
const authRoutes = require('./routes/auth.js');
const meetingsRoutes = require("./routes/meetings.js");
const eventsRoutes = require("./routes/events.js")
const contactsRoutes = require("./routes/contacts.js")
const availabilityRoutes = require("./routes/availability.js")
const usersRoutes = require("./routes/users.js")
const bookingRoutes = require("./routes/booking.js")

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use("/api/events", eventsRoutes)
app.use("/api/contacts", contactsRoutes)
app.use("/api/availability", availabilityRoutes)
app.use("/api/users", usersRoutes)
app.use("/api/booking", bookingRoutes)

// 404 handler for API routes that don't exist
app.use('/api/*splat', (req, res, next) => {
  return next(new AppError(`API endpoint ${req.method} ${req.originalUrl} not found`, 404));
});

// Serve static files AFTER API routes
app.use(express.static(path.join(__dirname, '../client/dist')));


// Express 5 compatible catch-all route - use named wildcard instead of *
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Global error handling middleware
app.use(errHandler);

module.exports = app;