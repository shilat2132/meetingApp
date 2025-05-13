const express = require('express');
const router = express.Router();

const authHandlers = require("../handlers/auth/middlewares")
const availabilityHandlers = require("../handlers/availability")

router.use(authHandlers.protect)
router.route("/")
    .get(availabilityHandlers.getAvailability)
    .patch(availabilityHandlers.updateAvailability)




module.exports = router;