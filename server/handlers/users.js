
const AppError = require('../utils/AppError.js');
const db = require('../db/db.js');
const crud = require("./crud.js")
const utils = require("../utils/utils.js")

exports.getUsers = async(req, res, next)=>{
    const query = `SELECT * FROM user`
    await crud.getAll(query, [], res, next)
}

exports.getAUser = async(req, res, next)=>{
    const query = `SELECT * FROM user WHERE uid = ?`
    await crud.getOne(query, [req.user.uid], res, next)
}

exports.updateUser = async(req, res, next)=>{
    const filteredBody = utils.filterBody(req.body, "name", "username", "email", "phone", "active")


    const condition = "uid = ?"
    const queryValues = [req.user.uid]
    await crud.updateOne("user", condition, filteredBody, queryValues, res, next, true, req)
}


exports.deleteUser = async(req, res, next)=>{
    const condition = "uid = ?"
    const queryValues = [req.user.uid]
    await crud.deleteOne("user", condition, queryValues, res, next)
}