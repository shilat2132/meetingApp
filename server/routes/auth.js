const express = require('express');
const router = express.Router();

const authHandlers = require('../handlers/auth/auth');


router.post('/signup', authHandlers.signUp);
router.post('/login', authHandlers.login);
router.post('/logout', authHandlers.logout);


module.exports = router;