const AppError = require("../utils/AppError")
const crud = require('./crud')
const db = require("../db/db");
const Email = require("../utils/Email");


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


        const query = `SELECT uid, eid, invitees_ids, start_time, end_time, date FROM meeting WHERE mid = ?`;
        const result = await db.query(query, [mid]);

        if (result.length === 0) {
            return next(new AppError("No meeting found with the given ID", 404));
        }

        const meeting = result[0];
         const {start_time, end_time, date, eid, uid: hostId} = meeting //used for email details
        const isHost = hostId === uid;

        // checks if current user is the host or invitee
        let invitees = JSON.parse(meeting.invitees_ids || '[]');
        const isInvitee = invitees.includes(uid);

        if (!isHost && !isInvitee) {
            return next(new AppError("You are neither the host nor a participant of this meeting", 403));
        }


        const eventQuery = `SELECT location, name FROM event_type WHERE eid = ?`
        const eventRes = await db.query(eventQuery, [eid])
        const {name: title, location} = eventRes[0]

        const hostRes = await db.query(`SELECT email, name FROM user WHERE uid = ?`, [hostId])
        const host = hostRes[0]
        let meetingDetails = { mid, title, start_time, end_time, date, location}

    
        // If host - delete the entire meeting
        if (isHost) {
            // Retrieve emails of invitees to notify them
            if (invitees.length > 0) {
                const emailsQuery = `SELECT email, name FROM user WHERE uid IN (?)`;
                const emails = await db.query(emailsQuery, [invitees]);

            // TODO: Send cancellation emails to all invitees and the host
            meetingDetails.toEmails = [...emails, req.user]

            try {
                await new Email(req.user, host).sendCanceledMeeting(meetingDetails)
            } catch (error) {
                console.error("Error in sending email in /meetings/cancelMeetings of the host", error)
            }

            }


            await crud.deleteOne("meeting", "mid = ?", [mid], res, next);
            return;
        }

        // If invitee - remove from invitees_ids
        const updatedInvitees = invitees.filter(id => id !== uid);

        if (updatedInvitees.length === 0) {
            // No invitees left, delete the meeting and email both the invitee and host

            
            
             try {
            meetingDetails.toEmails = [req.user, host]
                await new Email(req.user, host).sendCanceledMeeting(meetingDetails)
            } catch (error) {
                console.error("Error in sending email in /meetings/cancelMeetings of the invitee", error)
            }
            await crud.deleteOne("meeting", "mid = ?", [mid], res, next);
            return;
        }

        // Otherwise, update the meeting with the reduced invitees
        const updateQuery = `UPDATE meeting SET invitees_ids = ? , spots_left = spots_left +1 WHERE mid = ?`;
        await db.query(updateQuery, [JSON.stringify(updatedInvitees), mid]);

        // TODO: notify host or others
        // when the invitee cancels his participation and he's not the last invitee - send an email only to him
          try {
            meetingDetails.toEmails = [req.user]
                await new Email(req.user, host).sendCanceledMeeting(meetingDetails)
            } catch (error) {
                console.error("Error in sending email in /meetings/cancelMeetings of the invitee", error)
            }

        
        return res.status(200).json({
            status: 'success',
            message: 'Your participation was successfully cancelled.'
        });

    } catch (error) {
        return next(error);
    }
};
