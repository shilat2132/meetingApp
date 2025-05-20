const crud = require("./crud")
const AppError = require("../utils/AppError")
const db = require("../db/db")


/** retrives the availability of the user: week day ans start/end time */
exports.getAvailability = async (req, res, next) => {
    
    const query = `SELECT * FROM availability WHERE uid = ?`

    await crud.getAll(query, [req.user.uid], res, next)

}


exports.updateAvailability = async (req, res, next) => {
    // [{week_day: Sunday, available: true, start_time: hour, end_time: hour}, ....]
    const days = req.body.days;
    if (!days || !Array.isArray(days)) {
        return next(new AppError("You must include days array", 400))
    }

    const uid = req.user.uid
    // divide the days array to available and not available
    const available = days.filter(d => d.available)
    const unavailable = days.filter(d => !d.available).map(d => d.week_day)

    try{
        // delete all the unavailable days records
        if (unavailable.length > 0) {
            let placeholders = unavailable.map(u => "?").join(", ")

            const query = `DELETE FROM availability
                            WHERE uid = ? and week_day IN (${placeholders})`
            
                await db.query(query, [uid, ...unavailable])
        }

        // insert/update available days' records
        if (available.length > 0) {

            const insertValues = [];
            const placeholders = [];
    
            available.forEach(day => {
                insertValues.push(uid, day.week_day || null, day.start_time || null, day.end_time || null);
                placeholders.push('(?, ?, ?, ?)');
            });
    
            const query = `
                INSERT INTO availability (uid, week_day, start_time, end_time)
                VALUES ${placeholders.join(', ')}
                ON DUPLICATE KEY UPDATE
                start_time = VALUES(start_time),
                end_time = VALUES(end_time)
            `
    
            await db.query(query, insertValues);
            
            return res.status(200).json({status: "success"})
        }

        } catch (error) {
            return next(error)
        }
    

    
}