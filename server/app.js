const express = require('express');
const app = express();


const cookieParser = require('cookie-parser');

const cors = require('cors');


app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));

app.use(cookieParser());

const dotenv = require('dotenv');

const envFile = process.env.NODE_ENV === 'production' ? './prod.env' : './dev.env';
dotenv.config({ path: envFile });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const errHandler = require("./utils/errHandler.js")
const AppError = require('./utils/AppError.js');


// routes
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

const helmet = require('helmet');
app.use(helmet());



app.set('trust proxy', 1);

app.use((req, res, next) => {
    return next(new AppError(`Couldn't ${req.method} ${req.originalUrl}, 404`));
  });
  
  
  app.use(errHandler); // Global error handling middleware
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

module.exports = app;
