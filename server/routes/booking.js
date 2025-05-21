const express = require('express');
const router = express.Router();

const bookingHandlers = require('../handlers/booking');
const authHandlers = require("../handlers/auth/middlewares")


router.get("/events", bookingHandlers.getEvents)
router.use(authHandlers.protect)

router.post("/meetingsInRange", bookingHandlers.getMeetingsInRange)
router.post("/bookMeeting", bookingHandlers.addMeeting)



module.exports = router;