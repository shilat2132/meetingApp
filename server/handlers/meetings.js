const AppError = require("../utils/AppError")
const crud = require('./crud')


exports.getMeetings = async (req, res, next) => {
    
    // select meetings where the current user is the host(uid) or his id is in the invitees_ids 'array'
    const query = `
        SELECT meeting.*, event_type.name, event_type.type, 
            event_type.max_invitees, event_type.location
        FROM meeting
        JOIN event_type ON meeting.eid = event_type.eid
        WHERE 
            event_type.uid = ? 
            OR JSON_CONTAINS(meeting.invitees_ids, JSON_ARRAY(?))
        ORDER BY meeting.date, meeting.start_time
    `;
    const values = [req.user.uid, req.user.uid]
    await crud.getAll(query, values, res, next);

}


