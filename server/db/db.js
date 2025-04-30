const mysql = require('mysql');
const util = require('util');

// Create the connection for the database
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB_NAME
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error("Connection to MySQL database failed " + err.stack);
    return;
  }
  console.log("The database's connection id: " + db.threadId);

  // Create tables one by one in order
  const tableQueries = [

    // User table
    `CREATE TABLE IF NOT EXISTS user (
      uid INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      username VARCHAR(100) UNIQUE,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone CHAR(10) NOT NULL CHECK (phone REGEXP '^[0-9]{10}$'),
      role ENUM('user', 'manager') DEFAULT 'user',
      active BOOLEAN DEFAULT TRUE,
      manager INT DEFAULT NULL,
      last_modified_by INT DEFAULT NULL,
      last_modified_date DATETIME DEFAULT NULL,
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (manager) REFERENCES user(uid),
      FOREIGN KEY (last_modified_by) REFERENCES user(uid)
    )`,

    // Contact table
    `CREATE TABLE IF NOT EXISTS contact (
      c1id INT,
      c2id INT,
      PRIMARY KEY (c1id, c2id),
      FOREIGN KEY (c1id) REFERENCES user(uid) ON DELETE CASCADE,
      FOREIGN KEY (c2id) REFERENCES user(uid) ON DELETE CASCADE,
      CHECK (c1id <> c2id)
    )`,

    // Availability table
    `CREATE TABLE IF NOT EXISTS availability (
      uid INT,
      week_day ENUM('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      PRIMARY KEY (uid, week_day),
      FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE,
      CHECK (start_time < end_time)
    )`,

    // Event Type table
    `CREATE TABLE IF NOT EXISTS event_type (
      eid INT AUTO_INCREMENT PRIMARY KEY,
      uid INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      duration_time INT NOT NULL DEFAULT 1 ,
      duration_unit ENUM('minutes', 'hours') NOT NULL DEFAULT 'hours',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      type ENUM('one-on-one', 'group') NOT NULL,
      max_invitees INT DEFAULT 1 CHECK (max_invitees > 0),
      location ENUM('phone', 'in person') NOT NULL,
      FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE,
      CHECK (duration_time > 0)
    )`,

    // Meeting table
    `CREATE TABLE IF NOT EXISTS meeting (
      mid INT AUTO_INCREMENT PRIMARY KEY,
      eid INT NOT NULL,
      uid INT NOT NULL,
      date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      duration_time INT NOT NULL DEFAULT 1,
      duration_unit ENUM('minutes', 'hours') NOT NULL DEFAULT 'hours',
      invitees_amount INT NOT NULL CHECK (invitees_amount > 0),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      invitees_ids JSON NOT NULL,
      FOREIGN KEY (eid) REFERENCES event_type(eid) ON DELETE CASCADE,
      FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE,
      CHECK (start_time < end_time),
      CHECK (duration_time > 0)

    )`
  ];

  tableQueries.forEach((query) => {
    db.query(query, (err) => {
      if (err) {
        console.error("Couldn't create a table:", err.sqlMessage);
      } 
    });
  });
});

db.query = util.promisify(db.query);

module.exports = db;
