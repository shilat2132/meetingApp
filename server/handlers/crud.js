const AppError = require("../utils/AppError")
const db = require("../db/db")


exports.getAll = async (query, values, res, next) => {
    try {
        const docs = await db.query(query, values); 
        
        return res.status(200).json({
            status: 'success',
            amount: docs.length,
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
exports.updateOne = async (tableName, condition, updatedValues, queryValues, res, next, updateUser = false, req = null) => {
    try {
        if (Object.keys(updatedValues).length === 0) {
            return next(new AppError("You must provide valid, non-empty attributes for the update"))
          }
         const query = `UPDATE ${tableName}
                    SET ${Object.keys(updatedValues).map(key=> `${key} = ?`)}
                    WHERE ${condition}`
        
        queryValues.unshift(...Object.values(updatedValues))
        
        const result = await db.query(query, queryValues);

        if (result.affectedRows !== 1) {
            
            return next(new AppError(`${tableName} wasn't found`, 500));
        }

        const updatedId = parseInt(queryValues[queryValues.length - 1]);

        // if this is the handler for updating user, we need to update his details in the req object
        if(updateUser){
            const query = 'SELECT uid, email, role FROM user WHERE uid = ?';
           
            const result = await db.query(query, [updatedId]);
            req.user = result[0] || null;

        }
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
 */
exports.deleteOne = async (tableName, condition, values, res, next, emails= null, msg=null) =>{
    try {
       const query =  `DELETE FROM ${tableName}
                        WHERE ${condition}`

           const result = await db.query(query, values);

           if (result.affectedRows !== 1) {
               return next(new AppError(`${tableName} wasn't found`, 500));
           }

           if(emails){
            // send the emails for each email in the array with the given msg
           }
   
           return res.status(204).json({
               status: 'success'
           });
       } catch (err) {
           // console.log(err)
           return next(err);
       }
}