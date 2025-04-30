const app = require('./app.js');
const db = require('./db/db.js');

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
