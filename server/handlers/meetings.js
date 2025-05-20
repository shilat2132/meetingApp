const AppError = require("../utils/AppError")
const crud = require('./crud')
const db = require("../db/db")


exports.getMeetings = async (req, res, next) => {

    // select meetings where the current user is the host(uid) or his id is in the invitees_ids 'array'
    const query = `
        SELECT meeting.* , DATE_FORMAT(meeting.date, '%Y-%m-%d') AS date, event_type.name, event_type.type, event_type.location
        FROM meeting
        JOIN event_type ON meeting.eid = event_type.eid
        WHERE 
            meeting.uid = ? 
            OR JSON_CONTAINS(meeting.invitees_ids, JSON_ARRAY(?))
        ORDER BY meeting.date, meeting.start_time
    `;
    const values = [req.user.uid, req.user.uid]

    try {
    const meetings = await db.query(query, values)

    // collect all invitees ids
    const inviteeUidsSet = new Set();
    meetings.forEach(meeting => {
        const invitees = JSON.parse(meeting.invitees_ids || '[]');
        invitees.forEach(id => inviteeUidsSet.add(id));
        inviteeUidsSet.add(meeting.uid)
    });

    const inviteeUids = [...inviteeUidsSet];

    // retrives all the invitees' info
    let inviteesInfo = [];
    if (inviteeUids.length > 0) {
      const placeholders = inviteeUids.map(() => '?').join(', ');
      const userQuery = `SELECT uid, name, email FROM user WHERE uid IN (${placeholders})`;
      inviteesInfo = await db.query(userQuery, inviteeUids);
    }

    // map uid to his info
    const userMap = {};
    inviteesInfo.forEach(user => {
      userMap[user.uid] = user;
    });

    // integrate the meetings with the invitees
    const meetingsWithInvitees = meetings.map(meeting => {
      const invitees = JSON.parse(meeting.invitees_ids || '[]');
      return {
        ...meeting,
        host: userMap[meeting.uid],
        invitees: invitees.map(id => userMap[id] || { uid: id, name: 'Unknown', email: '' })
      };
    });

    res.status(200).json({docs: meetingsWithInvitees});
  } catch (error) {
    next(error);
  }

}


/**an handler for the host to cancel the meeting (delete the record) and send an email to all the invitees or for an invitee to cancel participation */

exports.cancelMeeting = async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const mid = req.params.mid;


        const query = `SELECT uid, invitees_ids FROM meeting WHERE mid = ?`;
        const result = await db.query(query, [mid]);

        if (result.length === 0) {
            return next(new AppError("No meeting found with the given ID", 404));
        }

        const meeting = result[0];
        const isHost = meeting.uid === uid;

        let invitees = JSON.parse(meeting.invitees_ids || '[]');
        const isInvitee = invitees.includes(uid);

        if (!isHost && !isInvitee) {
            return next(new AppError("You are neither the host nor a participant of this meeting", 403));
        }

        // If host - delete the entire meeting
        if (isHost) {
            // Retrieve emails of invitees to notify them
            if (invitees.length > 0) {
                const emailsQuery = `SELECT email, name FROM user WHERE uid IN (?)`;
                const emails = await db.query(emailsQuery, [invitees]);

            // TODO: Send cancellation emails to all invitees

            }


            await crud.deleteOne("meeting", "mid = ?", [mid], res, next);
            return;
        }

        // If invitee - remove from invitees_ids
        const updatedInvitees = invitees.filter(id => id !== uid);

        if (updatedInvitees.length === 0) {
            // No invitees left, delete the meeting
            await crud.deleteOne("meeting", "mid = ?", [mid], res, next);
            return;
        }

        // Otherwise, update the meeting with the reduced invitees
        const updateQuery = `UPDATE meeting SET invitees_ids = ? , spots_left = spots_left +1 WHERE mid = ?`;
        await db.query(updateQuery, [JSON.stringify(updatedInvitees), mid]);

        // TODO: Optionally notify host or others

        return res.status(200).json({
            status: 'success',
            message: 'Your participation was successfully cancelled.'
        });

    } catch (error) {
        return next(error);
    }
};
