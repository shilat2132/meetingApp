const express = require('express');
const app = express();
const dotenv = require("dotenv");
dotenv.config({ path: './config.env' });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const errHandler = require("./utils/errHandler.js")
const AppError = require('./utils/AppError.js');


// routes
const authRoutes = require('./routes/auth.js');
const meetingsRoutes = require("./routes/meetings.js");
const eventsRoutes = require("./routes/events.js")


app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use("/api/events", eventsRoutes)


app.set('trust proxy', 1);

app.use((req, res, next) => {
    return next(new AppError(`Couldn't ${req.method} ${req.originalUrl}, 404`));
  });
  
  
  app.use(errHandler); // Global error handling middleware
module.exports = app;
