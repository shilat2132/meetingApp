
```markdown
# 📅 Booking Management System

A full-stack scheduling application inspired by **Calendly**, built during my internship.  
The platform allows users to create event types, manage availability, and let others seamlessly book meetings online.


---

## 🚀 Features


- **Custom Availability Settings**  
  Users can define availability for each day of the week and update it anytime.

- **Dynamic Booking Flow**  
    Users can book a meeting via the booking link.

- **Event Management**  
  Create different meeting types with customizable details:
  - Set a **maximum number of participants**.
  - Define the **meeting mode**: phone, in-person, or Zoom.

- **Real-Time Scheduling**  
  Automatically updates time slots to prevent double bookings.

- **Responsive Design**  
  Mobile-friendly layout using media queries for a great experience on all screen sizes.

---

## 🛠️ Tech Stack

**Frontend:**  
- React  

**Backend:**  
- Node.js  
- Express.js  

**Database:**  
- MySQL (SQL schemas included in `/database` folder)


---

## 📂 Project Structure

```


## ⚙️ Usage

### 1. Create Event Types
Users can create **event types**, which represent different kinds of meetings.  

### 2. Manage Availability
- Set available days and time ranges for each day of the week.
- Mark days as unavailable when needed.

### 3. Booking Flow
Visitors follow these steps:
1. Select the **event type** they want to book.
2. Choose a **date** from the calendar.
3. Select an **available time slot**.
4. Confirm the booking.

---

## 💾 Database

The `/database` folder contains all SQL files required to set up the database schema.  
Run the following in MySQL to create and configure the database:

```sql
SOURCE database/schema.sql;
````

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/shilat2132/meetingApp.git
cd meetingApp
```

### 2. Install dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd client
npm install
```

### 3. Configure environment variables

Create a `dev.env` file in the `server` folder with the following variables:

```env
# App Environment
NODE_ENV=development

# MySQL Database Configuration
MYSQL_USER=your_mysql_username
MYSQL_PASSWORD=your_mysql_password
MYSQL_HOST=localhost
MYSQL_DB_NAME=calendar

# Frontend Domain
CLIENT_DOMAIN=http://localhost:8080

# JWT (JSON Web Token) Settings
JWT_COOKIE_EXPIRES_IN=14
JWT_EXPIRESIN=14d
JWT_SECRET=your_super_secure_secret_key_here

# Mailtrap SMTP (for email testing)
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USERNAME=your_mailtrap_username
MAILTRAP_PASSWORD=your_mailtrap_password

# SMTP (for sending real emails in production)
SMTP_USER=calendar@yourdomain.com
```

---

### 📝 Notes:

* **JWT\_SECRET** should be a long, random string for security.
* Replace `MAILTRAP_USERNAME` and `MAILTRAP_PASSWORD` with credentials from your [Mailtrap](https://mailtrap.io/) account for testing emails.
* Use `SMTP_USER` when integrating a real email service in production (e.g., SendGrid, Gmail, etc.).


Create a `.env.development` file in the `client` folder with the following variable:
VITE_API_BASE_URL=http://localhost
```





### 4. Start the development servers

```bash
# Start backend
cd server
npm run dev

# Start frontend
cd client
npm run start
```




## 🧑‍💻 Author

Developed by **Shilat Dahan** during internship as a scheduling solution project inspired by Calendly.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```



