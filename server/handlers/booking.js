const AppError = require("../utils/AppError")
const crud = require('./crud')
const db = require("../db/db")
const { calculateEndTime, isValidTime, isBeforeToday } = require("../utils/utils")
const Email = require("../utils/Email")

const daysDict = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']


/** Retrives the active events of the user with the given email along with an array of his working days for the booking page */
exports.getEvents = async (req, res, next) => {
    const email = req.query.email

    if (!email) {
        return next(new AppError("You must provide an email in the query params", 400))
    }


    try {
        const user = await db.query(`SELECT uid, name FROM user WHERE email = ?`, [email])

        if (user.length == 0) {
            return next(new AppError("No user found with that email address", 400))
        }


        // retrive the active events of the user with the given email
        const uid = user[0].uid
        let query = `SELECT * FROM event_type
                    WHERE uid = ? AND is_active = true
                    `

        const values = [uid]
        const events = await db.query(query, values);

        query = `SELECT week_day FROM availability WHERE uid = ?`

        // select the user's availability
        let availability = await db.query(query, values)
        availability = availability.map(a => a.week_day)


        return res.status(200).json({
            status: 'success',
            events_amount: events.length,
            uid,
            name: user[0].name,
            events,
            availability
        });


    } catch (error) {
        return next(error)
    }

}





/**
 * returns booked meetings of the host for each day in the range of 7 available days of the given date. 
 *  - this would be used in the booking page in order to skip booked hours in the computation of time slots
 * @requestBodyParams 
 *  - date - the date to start the range from
 *  - uid - the id of the event host to select his booked meetings
 
 */
exports.getMeetingsInRange = async (req, res, next) => {

    let { uid: hostId, date } = req.body

    if (!hostId || !date) {
        return next(new AppError("One of the details are missing", 400))
    }
    hostId = Number(hostId)
    try {
        const availabilityQuery = `SELECT * FROM availability WHERE uid = ?`

        const availability = await db.query(availabilityQuery, [hostId]) //the availability records
        // "week_day": "Sunday",
        // "start_time": "08:00:00",
        // "end_time": "16:00:00"

        if (availability.length == 0) {
            return next(new AppError("The host hasn't set availability, therefore, you can't book a meeting with him", 409))
        }


        // a dict in the format of: {1: {start_time: "8:00", end_time: "17:00"}} where the key is the day's number

        const availableDays = availability.reduce((acc, d) => {
            const index = daysDict.indexOf(d.week_day);
            if (index !== -1) {
                acc[index] = { start_time: d.start_time, end_time: d.end_time }
            }
            return acc;
        }, {});



        // set an object for the next available 7 days starting from the given date, with the date as a key and the working hours
        const days = {}
        let currentDate = new Date(date)

        while (Object.keys(days).length < 7) {
            const dateDay = currentDate.getDay()

            if (availableDays[dateDay]) {
                const dateStr = currentDate.toISOString().split('T')[0]; //change format '2025-05-13'
                days[dateStr] = { ...availableDays[dateDay] }
            }

            currentDate.setDate(currentDate.getDate() + 1)
        }

        const datesArray = Object.keys(days)
        const placeholders = datesArray.map(() => '?').join(', ');

        // selects the host's meetings to skip their hours in the available hours slots in the booking page
        const meetingsQuery = `SELECT mid, eid, spots_left, start_time, end_time, DATE_FORMAT(date, '%Y-%m-%d') AS date
                                FROM meeting
                                WHERE (uid = ? OR JSON_CONTAINS(meeting.invitees_ids, JSON_ARRAY(?)))
                                        AND date in (${placeholders})`


        const values = [hostId, hostId, ...datesArray]

        const meetings = await db.query(meetingsQuery, values)

        // map each meeting to its corresponding date in the days array
        meetings.forEach(meeting => {
            const d = new Date(meeting.date)
            const dateStr = d.toISOString().split('T')[0]
            if (!days[dateStr].meetings) days[dateStr].meetings = []
            days[dateStr].meetings.push(meeting)
        });

        return res.status(200).json({ days })

    } catch (error) {
        return next(error)
    }
}



/**
 * In case of a user trying to add himself to an exsisting meeting - checks if there are spots left 
 *  - ensures that the current user doesn't have another meeting in that time
 * @param {number} mid - the id of the meeting to update
 * @param {*} uid - the id of the user
 */
const updateMeeting = async (mid, uid, res, next, req) => {
    try {
        const meetingQuery = `
      SELECT uid, eid, date, start_time, end_time, invitees_ids 
      FROM meeting 
      WHERE mid = ? AND spots_left > 0
    `;
        const meeting = await db.query(meetingQuery, [mid])

        if (meeting.length === 0) {
            return next(new AppError("The meeting doesn't exist or it's full", 409))
        }

        const { uid: hostId, date, start_time, end_time, invitees_ids: inviteesRaw, eid } = meeting[0];
        const invitees_ids = JSON.parse(inviteesRaw);


        // prevents from the user to book himself twice to the same meeting
        if (invitees_ids.includes(uid)) {
            return next(new AppError("You are already invited to this meeting", 409))
        }

        if (hostId === uid) {
            return next(new AppError("You can't schedule a meeting with yourself ", 400))
        }

        const conflictQuery = `
                            SELECT mid FROM meeting
                            WHERE date = ?
                                AND (
                                    uid = ? OR
                                    JSON_CONTAINS(invitees_ids, JSON_ARRAY(?))
                                    )
                                AND (
                                    (start_time < ? AND end_time > ?)
                                    )
                                AND mid != ?
                            `;

        const conflicts = await db.query(conflictQuery, [
            date,
            uid, uid,
            end_time, start_time,
            mid
        ]);

        if (conflicts.length > 0) {
            return next(new AppError("You already have a meeting at this time.", 409));
        }

  


        const eventQuery = `SELECT name, location FROM event_type WHERE eid = ?`
        const eventRes = await db.query(eventQuery, [eid])
        const { name: title, location } = eventRes[0]


        // retrive all the invitees' name and email for attendees in the email
        const allInviteesIds = [...invitees_ids, uid];
        const placeholders = allInviteesIds.map(() => '?').join(',');
        const attendeesQuery = `
            SELECT name, email 
            FROM user 
            WHERE uid IN (${placeholders})
        `;
        const attendees = await db.query(attendeesQuery, allInviteesIds);

        const hostRes = await db.query(`SELECT email, name, phone, zoom_link FROM user WHERE uid = ?`, [hostId])
        const host = hostRes[0]
        const meetingDetails = {
            mid,
            title,
            start_time,
            end_time,
            date,
            location,
            attendees
        };

        
        if(location === 'zoom' && !host.zoom_link) {
            return next(new AppError("The host hasn't set a zoom link for this event. therefore, it can't be scheduled", 400))
        }

              // insert the user id to the invitees and decrement the spots_left field
        const updateQuery = `
            UPDATE meeting
            SET 
                spots_left = spots_left - 1,
                invitees_ids = JSON_ARRAY_APPEND(invitees_ids, '$', ?)
            WHERE mid = ?
        `;

        const result = await db.query(updateQuery, [uid, mid]);

        if (result.affectedRows !== 1) {
            return next(new AppError("Failed to update the meeting", 500));
        }

        try {
            await new Email(req.user, host).sendScheduledMeeting(meetingDetails)
        } catch (error) {
            console.error("Error sending email in /booking/updateMeeting", error)
        }
        return res.status(200).json({
            status: 'success',
            message: 'Meeting updated successfully'
        });

    } catch (error) {
        return next(error);
    }
}





/** creates a meeting or insert a new invitees (they are distinguished by whether there is a field of mid in the req.body)
 * @requestBodyParams
 *  - mid: the id of a meeting in case it's already exist and there is a new participin
 *      - the following are required just for creating a new meeting
 *  - eid: the event id that the meeting is booked to
 *  - start_time: the starting time of the meeting
 *  - date: the date for the meeting
 * 
 *  - checks if the meeting is available to be booked - meaning it's in the working time of the host and he doesn't have another meeting in that time
 */
exports.addMeeting = async (req, res, next) => {
    const { mid, eid, start_time, date } = req.body;
    if (mid) {
        return await updateMeeting(mid, req.user.uid, res, next, req);
    }

    if (!eid || !start_time || !date) {
        return next(new AppError("One of the details is missing. Please provide: event id, start time, and date or just meeting id if the meeting already exists", 400));
    }

    if (isBeforeToday(date)) {
        return next(new AppError("You can't book a meeting in the past", 400));
    }
    if (!isValidTime(start_time)) {
        return next(new AppError("Invalid time format. Expected H:MM or HH:MM or HH:MM:SS or H:MM:SS", 400));
    }

    //validates date
    const inputDate = new Date(date);
    if (isNaN(inputDate.getTime())) {
        return next(new AppError("The provided date is invalid.", 400));
    }

    // convert to sql dates format (YYYY-MM-DD)
    const sqlDate = inputDate.toISOString().split('T')[0];


    try {
        const eventQuery = `
            SELECT duration_time, duration_unit, uid, max_invitees, name, location
            FROM event_type 
            WHERE eid = ? AND is_active = TRUE
        `;
        const eventArr = await db.query(eventQuery, [eid]);

        if (eventArr.length === 0) {
            return next(new AppError("Couldn't schedule meeting: event doesn't exist or is not active.", 400));
        }

        const event = eventArr[0];
        const hostId = Number(event.uid);
        const { location, name: title, duration_time, duration_unit } = event



        if (hostId === req.user.uid) {
            return next(new AppError("You can't schedule a meeting with yourself ", 400))
        }

        const end_time = calculateEndTime(start_time, duration_time, duration_unit);

        // Ensure that the event's host is available in the given time
        const availabilityQuery = `SELECT week_day FROM availability WHERE uid = ? AND week_day = ? AND start_time <= ? AND end_time >= ?`
        const values = [hostId, daysDict[inputDate.getDay()], start_time, end_time]

        const result = await db.query(availabilityQuery, values)

        if (result.length == 0) {
            return next(new AppError("The host of the event isn't available in the given time ", 400))
        }

        // ensures that there aren't any meeting for the host or the requester in the same date and same time
        const conflictQuery = `
            SELECT mid FROM meeting
            WHERE date = ?
              AND (
                    uid = ? OR
                    uid = ? OR
                    JSON_CONTAINS(invitees_ids, JSON_ARRAY(?)) OR
                    JSON_CONTAINS(invitees_ids, JSON_ARRAY(?))
                  )
              AND (
                    (start_time < ? AND end_time > ?)
                  )
        `;

        const conflicts = await db.query(conflictQuery, [
            sqlDate,
            req.user.uid, hostId,
            req.user.uid, hostId,
            end_time, start_time
        ]);

        if (conflicts.length > 0) {
            return next(new AppError("Couldn't book a meeting: You or the host of the event already have another meeting at this time.", 409));
        }

        const spots_left = event.max_invitees - 1 || 1;
        const invitees_ids = JSON.stringify([req.user.uid]);

        const meetingBody = {
            eid,
            uid: hostId,
            date: sqlDate,
            start_time,
            end_time,
            spots_left,
            invitees_ids
        };


        const hostRes = await db.query(`SELECT email, name, phone, zoom_link FROM user WHERE uid = ?`, [hostId])
        const host = hostRes[0]
        let meetingDetails = { location, title, start_time, end_time, date: sqlDate, host }

         if(location === 'zoom' && !host.zoom_link) {
            return next(new AppError("The host hasn't set a zoom link for this event. therefore, it can't be scheduled", 400))
        }

        await crud.insertOne("meeting", meetingBody, res, next, meetingDetails, req);

    } catch (error) {
        return next(error);
    }
};
