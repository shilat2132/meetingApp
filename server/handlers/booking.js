const AppError = require("../utils/AppError")
const crud = require('./crud')
const db = require("../db/db")


exports.getEvents = async (req, res, next) =>{
    const email = req.query.email

    if(!email){
        return next(new AppError("You must provide an email in the query params", 400))
    }

    
    try {
        const user = await db.query(`SELECT uid FROM user WHERE email = ?`, [email])

        if(user.length==0){
            return next(new AppError("No user found with that email address", 400))
        }

        const uid = user[0].uid
        let query = `SELECT * FROM event_type
                    WHERE uid = ? AND is_active = true
                    `

        const values = [uid]


        const events = await db.query(query, values); 

        query = `SELECT * FROM availability WHERE uid = ?`

        const availability = await db.query(query, [uid])

                
                return res.status(200).json({
                    status: 'success',
                    events_amount: events.length,
                    events,
                    availability
                });


    } catch (error) {
        return next(error)
    }
     
}