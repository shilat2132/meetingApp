const express = require('express');
const router = express.Router();

const authHandlers = require("../handlers/auth/middlewares")
const usersHandlers = require("../handlers/users")

router.use(authHandlers.protect)
router.route("/")
    .get(usersHandlers.getUsers)
    .patch(usersHandlers.updateUser)
    .delete(usersHandlers.deleteUser)

router.get("/me", usersHandlers.getAUser)




    module.exports = router;