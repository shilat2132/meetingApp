const AppError = require("../utils/AppError")
const db = require("../db/db")


exports.getAll = async (query, values, res, next) => {
    try {
        const docs = await db.query(query, values); 
        
        return res.status(200).json({
            status: 'success',
            docs
        });
    } catch (err) {
       return next(err);
    }
};


exports.getOne = async (query, values, res, next) => {
    try {
        query += "LIMIT 1";
        const doc = await db.query(query, values); 
        
        return res.status(200).json({
            status: 'success',
            doc
        });
    } catch (err) {
       return next(err);
    }
};


exports.insertOne = async (tableName, body, res, next) => {
    try {
        const query = `INSERT into ${tableName} 
                    (${Object.keys(body).join(", ")})
                    VALUES (${Object.entries(body).map(e=> '?').join(",")})
                    `
        const result = await db.query(query, Object.values(body));

        if (result.affectedRows !== 1) {
            return next(new AppError('Insert failed.', 500));
        }

        return res.status(201).json({
            status: 'success',
            data: {
                id: result.insertId
            }
        });
    } catch (err) {
        // console.log(err)
        return next(err);
    }
};


/** a dynamic handler for updating ONE record
 * @param tableName - the name of the table to be updated
 * @param condition - a string in the format of 'key1 = ? operator key2 = ? ....' for the WHERE clause. e.g: 'uid = ? and eid= ?'
 * @param updatedValues - the object of the attributes to be updated and their updated values
 * @param queryValues - the array values for the query, to fill the ?. might include values for the condition as well. 
 * 
 *  - IMPORTANT: the last element in queryValues must be the id of the record that being updated
 */
exports.updateOne = async (tableName, condition, updatedValues, queryValues, res, next) => {
    try {
         const query = `UPDATE ${tableName}
                    SET ${Object.keys(updatedValues).map(key=> `${key} = ?`)}
                    WHERE ${condition}`
        const result = await db.query(query, queryValues);

        if (result.affectedRows !== 1) {
            
            return next(new AppError(`${tableName} wasn't found`, 500));
        }

        const updatedId = parseInt(queryValues[queryValues.length - 1]);
        return res.status(201).json({
            status: 'success',
            data: {
                id: updatedId
            }
        });
    } catch (err) {
        // console.log(err)
        return next(err);
    }
};


/** a dynamic handler for updating ONE record
 * @param tableName - the name of the table to be updated
 * @param condition - a string in the format of 'key1 = ? operator key2 = ? ....' for the WHERE clause. e.g: 'uid = ? and eid= ?'
 * @param values - the array values for the query, to fill the ?. 
 * 
 *  - IMPORTANT: the last element in values array must be the id of the record that being updated
 */
exports.deleteOne = async (tableName, condition, values, res, next) =>{
    try {
       const query =  `DELETE FROM ${tableName}
                        WHERE ${condition}`

           const result = await db.query(query, values);

           if (result.affectedRows !== 1) {
               return next(new AppError(`${tableName} wasn't found`, 500));
           }
   
           const updatedId = parseInt(values[values.length - 1]);
           return res.status(201).json({
               status: 'success',
               data: {
                   id: updatedId
               }
           });
       } catch (err) {
           // console.log(err)
           return next(err);
       }
}