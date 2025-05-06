const express = require('express');
const router = express.Router();

const authHandlers = require("../handlers/auth/middlewares")
const contactHandlers = require("../handlers/contacts")

router.use(authHandlers.protect)
router.route("/")
    .get(contactHandlers.getContacts)
    .post(contactHandlers.createContact)


router.route("/:uid")
    .get(contactHandlers.getAContact)
    .delete(contactHandlers.deleteContact)


module.exports = router;