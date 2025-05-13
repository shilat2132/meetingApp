/**
     * @param obj - the current object to filter
     * @param allowedFields - the fields that can remain in the object
     * @returns the object containing only the allowed fields
     */
exports.filterBody = (obj, ...allowedFields) =>{
    
    const newObj = {}
    // goes over the obj's fields and only if it's part of the allowed fields, adds it to the new object
    Object.keys(obj).forEach(el =>{
        if(allowedFields.includes(el)){
            newObj[el] = obj[el]
        }
    })
    return newObj
}


/**
 * Calculates the end time given a start time, duration, and unit.
 * @param {string} startTime - The start time in "HH:MM" or "HH:MM:SS" format.
 * @param {number} duration - The duration to add.
 * @param {"minutes"|"hours"} unit - The unit of the duration.
 * @returns {string} The end time in "HH:MM:SS" format.
 */
exports.calculateEndTime = (startTime, duration, unit) => {
    const [hours, minutes, seconds = "00"] = startTime.split(":").map(Number);
    const date = new Date(0, 0, 0, hours, minutes, seconds);

    if (unit === "minutes") {
        date.setMinutes(date.getMinutes() + duration);
    } else if (unit === "hours") {
        date.setHours(date.getHours() + duration);
    } else {
        throw new Error("Invalid duration unit. Use 'minutes' or 'hours'.");
    }

    // Format to HH:MM:SS
    const pad = n => n.toString().padStart(2, "0");
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}