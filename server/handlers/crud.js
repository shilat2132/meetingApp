const AppError = require("../utils/AppError")
const db = require("../db/db")


exports.getAll = async (query, values, req, res, next) => {
    try {
        const docs = await db.query(query, values); 
        
        return res.status(200).json({
            status: 'success',
            data: { docs }
        });
    } catch (err) {
       return next(new AppError(err, 500));
    }
};



exports.insertOne = async (query, values, req, res, next) => {
    try {
        const [result] = await db.query(query, values);

        if (result.affectedRows !== 1) {
            return next(new AppError('Insert failed.', 500));
        }

        return res.status(201).json({
            status: 'success',
            data: {
                eid: result.insertId
            }
        });
    } catch (err) {
        return next(new AppError(err, 500));
    }
};
