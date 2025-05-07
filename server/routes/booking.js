const express = require('express');
const router = express.Router();

const bookingHandlers = require('../handlers/booking');
const authHandlers = require("../handlers/auth/middlewares")


router.use(authHandlers.protect)
router.get("/events", bookingHandlers.getEvents)



module.exports = router;