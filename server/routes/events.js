const express = require('express');
const router = express.Router();

const eventsHandlers = require('../handlers/events');
const authHandlers = require("../handlers/auth/middlewares")


router.use(authHandlers.protect)
router.route("/")
    .get(eventsHandlers.getEvents)
    .post(eventsHandlers.createEvent)


module.exports = router;