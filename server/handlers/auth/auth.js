const AppError = require('../../utils/AppError.js');
const db = require('../../db/db.js');
const jwt = require('jsonwebtoken');
const crud = require("../crud.js")


const signToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRESIN })

/**
 * - creates the jwt token with the user's id as payload
 * - stores it in an http cookie named 'jwt', the token and the expiration date
 * - sends a server's response with the user's object, the token and its expiration
 */
const createSendToken = (user, req, statusCode, res) => {
    const token = signToken(user.uid)
    const tokenExpiration = new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    )

    const isProduction = process.env.NODE_ENV === 'production';

res.cookie('jwt', token, {
  expires: tokenExpiration,
  httpOnly: true,
  secure: isProduction, 
  sameSite: isProduction ? 'None' : 'Lax' 
});


    // res.cookie('jwt', token, {
    //     expires: tokenExpiration,
    //     httpOnly: true,
    //     // only in production
    //     secure: req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production'
    // });

    // Remove password from output
    res.status(statusCode).json({
        status: 'success',
        data: { token, tokenExpiration: process.env.JWT_COOKIE_EXPIRES_IN, user }
    })

}

exports.signUp = async (req, res, next) => {
    const { name, username, email, phone, role } = req.body;
    if (!name || !username || !email || !phone) {
        return next(new AppError('Please provide all required fields', 400));
    }

    const query = `INSERT INTO user (name, username, email, phone, role) VALUES (?, ?, ?, ?, ?)`;
    const values = [name, username, email, phone, role || 'user'];

    try {
        const result = await db.query(query, values)

        if (result.affectedRows !== 1) {
            return next(new AppError('Failed to create user', 500));
        }
        
        
        const newUser = { uid: result.insertId, name, username, email, phone };
        createSendToken(newUser, req, 201, res);

    } catch (err) {
        return next(err);
    }

}



exports.login = async (req, res, next) => {
    const {username, email} = req.body;
    if (!username || !email) {
        return next(new AppError('Please provide username and email', 400));
    }

    const query = `SELECT * FROM user WHERE username = ? AND email = ?`;
    const values = [username, email];

    try {
        const result = await db.query(query, values)

        if (result.length === 0) {
            return next(new AppError('Incorrect username or email', 401));
        }
        const user = { ...result[0] };
        createSendToken(user, req, 200, res);

    } catch (error) {
        return next(new AppError(err, 500));
    }

    
}


exports.logout = (req, res)=>{
    res.cookie('jwt', 'logout', { //overrite the cookie with the token
      expires: new Date(Date.now() + 10 *1000), httpOnly: true })
      res.status(200).json({status: 'success'})
  }


