const crud = require("./crud")
const utils = require("../utils/utils")
const AppError = require("../utils/AppError")
const db = require("../db/db")


exports.getEvents = async (req, res, next)=>{
    const query = `SELECT * FROM event_type
                    WHERE uid = ?`
    const values = [req.user.uid]
    await crud.getAll(query, values, res, next)
}

exports.getEvent = async (req, res, next)=>{
    const query = `SELECT * FROM event_type
                    WHERE uid = ? and eid = ?`
    const values = [req.user.uid, req.params.eid]
    await crud.getOne(query, values, res, next)
}

exports.createEvent = async (req, res, next)=>{
    let filterBody = utils.filterBody(req.body, "name", "duration_time", 
        "duration_unit", "type",  "max_invitees", "location")
    
    filterBody["uid"] = req.user.uid
    await crud.insertOne("event_type", filterBody, res, next )
}

exports.updateEvent = async (req, res, next)=>{

    let updatedValues;

    if(req.query.toggleActive){
        let is_active = req.query.toggleActive
        const boolDict = {'true': 1, 'false': 0}
        

    
        is_active = boolDict[is_active]
        if (is_active === undefined || is_active == null) {
            return next(new AppError("is_active can only be true or false"))
        }
        
        updatedValues = {is_active}
    }else{
        updatedValues = utils.filterBody(req.body, "name", "duration_time", 
            "duration_unit", "type",  "max_invitees", "location")
    }
    
    
    let queryValues = [req.user.uid, req.params.eid]

    const condition = 'uid = ? and eid= ?'
    await crud.updateOne("event_type", condition, updatedValues, queryValues, res, next)

}


exports.deleteEvent = async (req, res, next)=>{

    const condition = 'uid = ? and eid= ?'
    const values = [req.user.uid, req.params.eid]
    await crud.deleteOne("event_type", condition, values, res, next)
}
