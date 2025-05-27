const AppError = require('../../utils/AppError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const db = require('../../db/db.js');


/** A mw for protected routes to check whether the user is logged in - this is checked using the cookie */
exports.protect = async (req, res, next) => {

    // 1) Getting token and check of it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    const query = 'SELECT uid, email FROM user WHERE uid = ?';

try {
    const result = await db.query(query, [decoded.id]);

    if (!result[0]) {
        return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }

    req.user = result[0];
    next();
} catch (err) {
    return next(new AppError(err, 500));
}

}
