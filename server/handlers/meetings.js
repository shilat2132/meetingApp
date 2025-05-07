const AppError = require("../utils/AppError")
const crud = require('./crud')
const db = require("../db/db")


exports.getMeetings = async (req, res, next) => {

    // select meetings where the current user is the host(uid) or his id is in the invitees_ids 'array'
    const query = `
        SELECT meeting.*, event_type.name, event_type.type, event_type.location
        FROM meeting
        JOIN event_type ON meeting.eid = event_type.eid
        WHERE 
            meeting.uid = ? 
            OR JSON_CONTAINS(meeting.invitees_ids, JSON_ARRAY(?))
        ORDER BY meeting.date, meeting.start_time
    `;
    const values = [req.user.uid, req.user.uid]
    await crud.getAll(query, values, res, next);

}


/**an handler for the host to cancel the meeting (delete the record) and send an email to all the invitees */
exports.cancelMeeting = async (req, res, next) => {
    try {
        const condition = "uid = ? AND mid = ?"
        const query = `SELECT uid, invitees_ids FROM meeting WHERE ${condition}`
        const queryValues = [req.user.uid, req.params.mid]
        const result = await db.query(query, queryValues)

        if (result.length == 0) {
            return next(new AppError("No meeting was found with the given id with you as the host", 404))
        }

        const meeting = result[0]


        // Retrieve the invitees' emails and send them a cancellation email
        const emailsQuery = `SELECT email, name FROM user WHERE uid in (?)`
        const emails = await db.query(emailsQuery, meeting.invitees_ids)

        // when i'l set the email class, i'll send those emails to the emails array, and also send a different email for the host who canceled the meeting

        await crud.deleteOne("meeting", condition, queryValues, res, next, emails)
    } catch (error) {
        return next(error)
    }

}


/**an handler for the current user to cancel his participation in a certain meeting, only if he's invited to that meeting and is not the host */
exports.cancelMeetingParticipation = async (req, res, next) => {
   try {
    const condition = "uid != ? AND mid = ? AND JSON_CONTAINS(invitees_ids, JSON_ARRAY(?))"
    const query = `SELECT invitees_ids FROM meeting WHERE ${condition}`
    const uid = req.user.uid

    const queryValues = [uid, req.params.mid, uid]
    const result = await db.query(query, queryValues)

    if (result.length == 0) {
        return next(new AppError("No meeting was found with the given id with you as a participant", 404))
    }

    const invitees = JSON.parse(result[0].invitees_ids);
    const index = invitees.indexOf(uid);

    invitees.splice(index, 1)

    const updateQuery = `UPDATE meeting SET invitees_ids = ? WHERE mid = ?`;
    await db.query(updateQuery, [JSON.stringify(invitees), req.params.mid]);

    // here we need to send the email

    return res.status(201).json({
        status: 'success',
    });
   } catch (error) {
        return next(error)
   }



}


