const mysql = require('mysql');


// the connection for the database
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error("Connection to MySQL database failed " + err.stack);
    return;
  }
  console.log("The database's connection id " + db.threadId);
});



// db.query(meetingsTableQuery, (err, results) => {
//   if (err) {
//     console.error("Couldn't create a table", err);
//   } 
// });




module.exports = db;