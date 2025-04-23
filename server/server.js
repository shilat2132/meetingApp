const express = require('express');
const app = express();

const dotenv = require("dotenv");
dotenv.config({ path: './config.env' });
const db = require('./db/db.js');




app.use(express.json());
app.use(express.urlencoded({ extended: true }));





// app.use((req, res, next) => {
//   return next(new AppError(`Couldn't find ${req.originalUrl} with method ${req.method}`, 404));
// });

// app.use(errorHandler); // Global error handling middleware


app.set('trust proxy', 1);


process.on('SIGINT', () => {
  console.log("Closing database connection...");
  db.end((err) => {
    if (err) {
      console.error("Error closing the database connection:", err);
    } else {
      console.log("Database connection closed.");
    }
    process.exit(0); // Exit the process
  });
});








app.listen(5000, () => {
  console.log('Server is running on port 5000');
});