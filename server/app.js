const express = require('express');
const app = express();
const path = require('path');


const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

const envFile = process.env.NODE_ENV === 'production' ? './prod.env' : './dev.env';
dotenv.config({ path: envFile });

const cors = require('cors');


app.use(cors({
  origin:  process.env.CLIENT_DOMAIN,
  credentials: true
}));

app.use(cookieParser());



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

const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

const helmet = require('helmet');
app.use(helmet());

app.set('trust proxy', 1);


app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use("/api/events", eventsRoutes)
app.use("/api/contacts", contactsRoutes)
app.use("/api/availability", availabilityRoutes)
app.use("/api/users", usersRoutes)
app.use("/api/booking", bookingRoutes)




app.use(express.static(path.join(__dirname, 'client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

app.use((req, res, next) => {
    return next(new AppError(`Couldn't ${req.method} ${req.originalUrl}, 404`));
  });
  
  
app.use(errHandler); // Global error handling middleware


module.exports = app;
