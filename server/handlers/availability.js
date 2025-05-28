const crud = require("./crud")
const AppError = require("../utils/AppError")
const db = require("../db/db")
const { isValidTime, isStartBeforeEnd } = require("../utils/utils")


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

    try {
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
            for (const day of available) {
                if (!day.week_day || !day.start_time || !day.end_time) {
                    return next(new AppError("Each available day must have week_day, start_time and end_time", 400));
                }

                if (!isValidTime(day.start_time) || !isValidTime(day.end_time)) {
                    return next(new AppError("Invalid time format. Expected H:MM or HH:MM or HH:MM:SS or H:MM:SS", 400));
                }

                if (!isStartBeforeEnd(day.start_time, day.end_time)) {
                    return next(new AppError("Start time must be earlier than end time", 400));
                }

                insertValues.push(uid, day.week_day, day.start_time, day.end_time);
                placeholders.push('(?, ?, ?, ?)');
            }

            const query = `
                INSERT INTO availability (uid, week_day, start_time, end_time)
                VALUES ${placeholders.join(', ')}
                ON DUPLICATE KEY UPDATE
                start_time = VALUES(start_time),
                end_time = VALUES(end_time)
            `

            await db.query(query, insertValues);

            
        }
        return res.status(200).json({ status: "success" })
    } catch (error) {
        return next(error)
    }



}