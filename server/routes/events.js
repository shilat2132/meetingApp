const express = require('express');
const router = express.Router();

const eventsHandlers = require('../handlers/events');
const authHandlers = require("../handlers/auth/middlewares")


router.use(authHandlers.protect)
router.route("/")
    .get(eventsHandlers.getEvents)
    .post(eventsHandlers.createEvent)


router.route("/:eid")
    .get(eventsHandlers.getEvent)
    .patch(eventsHandlers.updateEvent)
    .delete(eventsHandlers.deleteEvent)


module.exports = router;