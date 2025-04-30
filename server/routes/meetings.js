const express = require('express');
const router = express.Router();

const meetingsHandlers = require('../handlers/meetings');
const authHandlers = require("../handlers/auth/middlewares")


router.use(authHandlers.protect)
router.route("/").get(meetingsHandlers.getMeetings)


module.exports = router;