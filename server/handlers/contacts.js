const crud = require("./crud")
const AppError = require("../utils/AppError")
const db = require("../db/db")


/** retrives all contacts of current user along with their id, email and name */
exports.getContacts = async (req, res, next)=>{

    const query = `SELECT user.uid, user.name, user.email
                        FROM contact
                        JOIN USER on user.uid = contact.c2id
                        WHERE contact.c1id = ?
                        `

    await crud.getAll(query, [req.user.uid], res, next)

}

exports.getAContact = async (req, res, next)=>{
    const c2id = Number(req.params.uid)
    const currentUser = Number(req.user.uid)



    try {
        // retrive the contact
        const contactQ = `SELECT name, email FROM user WHERE uid = ?`
        const contact = await db.query(contactQ, [c2id])

        if(contact.length == 0){
            return next(new AppError("User wasn't found", 404))
        }


        // retrive meetings with this contact
         // either the current user is the meeting host and the contact is one of the invitees or the other way around
        const query = `
        SELECT meeting.date, meeting.start_time, meeting.end_time, E.name
        FROM meeting

        JOIN event_type as E ON E.eid = meeting.eid
       
        WHERE (meeting.uid = ? AND JSON_CONTAINS(meeting.invitees_ids, JSON_ARRAY(?)))
                OR
              (meeting.uid = ? AND JSON_CONTAINS(meeting.invitees_ids, JSON_ARRAY(?)))
              OR
              (JSON_CONTAINS(meeting.invitees_ids, JSON_ARRAY(?)) AND JSON_CONTAINS(meeting.invitees_ids, JSON_ARRAY(?)))
        ORDER BY meeting.date, meeting.start_time
    `

        const values = [currentUser, c2id, c2id, currentUser, currentUser, c2id]
        const meetings = await db.query(query, values)
        
        const {name, email} = contact[0]
        return res.status(200).json({contact: {name, email}, meetings})
       
    } catch (error) {
        return next(error)
    }
}

/** given an email in the request body - add the corresponing user as a contact of the current user */
exports.createContact = async (req, res, next)=>{
// given a user email - select a user id that is different from the current user's id and 
// that his email equals to the given email

const email = req.body.email
if(!email){
    return next(new AppError("You must enter an email", 400))
}

const selectQuery = `SELECT uid FROM user
                    WHERE email = ?
                   `

const selectValues = [email]


try {
    const selectResult = await db.query(selectQuery, selectValues)

    if(selectResult.length == 0){
        return next(new AppError("No user was found with that email", 404))
    }

    if(selectResult[0].uid === req.user.uid){
        return next(new AppError("You can't add yourself as a contact", 404))
    }

    const body = {
        c1id: req.user.uid,
        c2id: selectResult[0].uid
    }

    await crud.insertOne("contact", body, res, next)
    

} catch (error) {
    return next(error)
}
}



/** given a uid in the params - delete the contact from the current user's contacts */
exports.deleteContact = async (req, res, next)=>{
    const c2id = req.params.uid
    if(!c2id){
        return next(new AppError("You have to provide contact's id", 400))
    }

    const condition = "c1id = ? and c2id = ?"

    const values = [req.user.uid, c2id]

    await crud.deleteOne("contact", condition, values, res, next )
}