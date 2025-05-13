
const db = require('../db/db.js');
const crud = require("./crud.js")
const utils = require("../utils/utils.js")

exports.getUsers = async(req, res, next)=>{
    const query = `SELECT * FROM user`
    await crud.getAll(query, [], res, next)
}

exports.getAUser = async(req, res, next)=>{
    const query = `SELECT uid, active, name, username, email, phone FROM user WHERE uid = ?`
    await crud.getOne(query, [req.user.uid], res, next)
}

exports.updateUser = async(req, res, next)=>{
    const filteredBody = utils.filterBody(req.body, "name", "username", "email", "phone", "active")


    const condition = "uid = ?"
    const queryValues = [req.user.uid]
    await crud.updateOne("user", condition, filteredBody, queryValues, res, next, true, req)
}


/** deletes the current user. all of his meeting (with him as a host) would automatically be deleted as well as his events and availability. 
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

    // 2. Delete the user from the user table
    await db.query(`DELETE FROM user WHERE uid = ?`, [uid]);

    res.status(200).json({ message: "User deleted successfully." });

  } catch (err) {
    next(err);
  }
};

