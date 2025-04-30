const crud = require("./crud")
const utils = require("../utils/utils")
const AppError = require("../utils/AppError")
const db = require("../db/db")


exports.getEvents = async (req, res, next)=>{

    const query = `SELECT * FROM event_type
                    WHERE uid = (?)`
    const values = [req.user.uid]

    await crud.getAll(query, values, req, res, next)
    
}


exports.createEvent = async (req, res, next)=>{
    let filterBody = utils.filterBody(req.body, "name", "duration_time", 
        "duration_unit", "type",  "max_invitees", "location")
    
    filterBody["uid"] = req.user.uid

    
    let query = `INSERT into event_type 
                    (${Object.keys(filterBody).join(", ")})
                    VALUES (${Object.entries(filterBody).map(e=> '?').join(",")})
                    `
    
    try {
        const result = await db.query(query, Object.values(filterBody))

        if (result.affectedRows !== 1) {
            return next(new AppError('Failed to create user', 500));
        }

        return res.status(201).json({
            data: {
                eid: result.insertId
            }
        })
    } catch (err) {
        return next(new AppError(err, 500))
    }
}