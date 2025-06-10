const mysql = require('mysql');
const util = require('util');

// Create a pool for the database (recommended)
const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB_NAME,
  timezone: 'Z',
  charset: 'utf8mb4'
});

// Promisify the query function to support async/await
db.query = util.promisify(db.query);
db.getConnection = util.promisify(db.getConnection);

// Create tables one by one
const tableQueries = [

  // User table
  `CREATE TABLE IF NOT EXISTS user (
    uid INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    zoom_link VARCHAR(255),
    phone CHAR(10) NOT NULL CHECK (phone REGEXP '^[0-9]{10}$'),
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP
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
    name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
    duration_time INT NOT NULL DEFAULT 1,
    duration_unit ENUM('minutes', 'hours') NOT NULL DEFAULT 'hours',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    type ENUM('one-on-one', 'group') NOT NULL,
    max_invitees INT DEFAULT 1 CHECK (max_invitees > 0),
    location ENUM('phone', 'in person', 'zoom') NOT NULL,
    FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE,
    CHECK (duration_time > 0)
  ) CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci`,

  // Meeting table
  `CREATE TABLE IF NOT EXISTS meeting (
    mid INT AUTO_INCREMENT PRIMARY KEY,
    eid INT NOT NULL,
    uid INT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    spots_left INT NOT NULL CHECK (spots_left >= 0),
    invitees_ids JSON NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (eid) REFERENCES event_type(eid) ON DELETE CASCADE,
    FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE,
    CHECK (start_time < end_time)
  )`
];

// Execute table creation queries
(async () => {
  try {
    for (const query of tableQueries) {
      await db.query(query);
    }
    console.log("All tables created or verified successfully.");
  } catch (err) {
    console.error("Error creating tables:", err.sqlMessage || err.message);
  }
})();

module.exports = db;
