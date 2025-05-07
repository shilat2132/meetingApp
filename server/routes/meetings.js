const express = require('express');
const router = express.Router();

const meetingsHandlers = require('../handlers/meetings');
const authHandlers = require("../handlers/auth/middlewares")


router.use(authHandlers.protect)
router.route("/").get(meetingsHandlers.getMeetings)
router.route("/:mid").delete(meetingsHandlers.cancelMeeting).patch(meetingsHandlers.cancelMeetingParticipation)


module.exports = router;