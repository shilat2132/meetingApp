
const db = require('../db/db.js');
const crud = require("./crud.js")
const utils = require("../utils/utils.js");
const AppError = require('../utils/AppError.js');

exports.getUsers = async(req, res, next)=>{
    const query = `SELECT * FROM user`
    await crud.getAll(query, [], res, next)
}

exports.getAUser = async(req, res, next)=>{
    const query = `SELECT uid, name, username, email, phone, zoom_link FROM user WHERE uid = ?`
    await crud.getOne(query, [req.user.uid], res, next)
}

exports.updateUser = async(req, res, next)=>{
    const filteredBody = utils.filterBody(req.body, "name", "username", "email", "phone", "zoom_link")

    if(filteredBody.email){
      const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!regex.test(filteredBody.email)) {
        return next(new AppError('Invalid email format', 400));
    }
    }

    if(filteredBody.zoom_link){
      try {
        const zoomLink = utils.normalizeZoomLink(filteredBody.zoom_link);
        filteredBody.zoom_link = zoomLink;
      } catch (error) {
        return next(new AppError("Invalid Zoom link format", 400));
      }
    }

    const condition = "uid = ?"
    const queryValues = [req.user.uid]
    await crud.updateOne("user", condition, filteredBody, queryValues, res, next, true, req)
}


/** deletes the current user and log him out. all of his meeting (with him as a host) would automatically be deleted as well as his events and availability. 
 *  - but meetings with him as invitee would be deleted in this handler manually  */
exports.deleteUser = async (req, res, next) => {
  const uid = req.user.uid;

  try {
    // 1. Find all meetings where the user is in the invitees_ids JSON array
    const meetingsToUpdate = await db.query(
      `SELECT mid, invitees_ids, spots_left FROM meeting WHERE JSON_CONTAINS(invitees_ids, JSON_ARRAY(?))`,
      [uid]
    );

    // Update each meeting where the user is an invitee
    for (const meeting of meetingsToUpdate) {
      const invitees = JSON.parse(meeting.invitees_ids);

      // Remove the user ID from the invitees array
      const updatedInvitees = invitees.filter(id => id !== uid);

      // If after removing the user, the invitees array is empty, delete the meeting
      if (updatedInvitees.length === 0) {
        await db.query(`DELETE FROM meeting WHERE mid = ?`, [meeting.mid]);
        continue; // Skip to the next meeting since this one is deleted
      }

      // Update the meeting: set new invitees array and increase spots_left by 1
      await db.query(
        `UPDATE meeting 
         SET invitees_ids = ?, spots_left = spots_left + 1 
         WHERE mid = ?`,
        [JSON.stringify(updatedInvitees), meeting.mid]
      );
    }

    // 2. overwrite the jwt
      res.cookie('jwt', 'logout', { expires: new Date(Date.now() + 10 *1000), httpOnly: true })

    // 3. Delete the user from the user table
    await db.query(`DELETE FROM user WHERE uid = ?`, [uid]);

    res.status(200).json({ message: "User deleted successfully." });

  } catch (err) {
    next(err);
  }
};

