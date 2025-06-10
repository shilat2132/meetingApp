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

/** validates time format for HH:MM OR HH:MM:SS */
exports.isValidTime = (time) => {
  return /^((0?\d)|(1\d)|(2[0-3])):[0-5]\d(:[0-5]\d)?$/.test(time);
};


/** checks that start time is before the end time */
exports.isStartBeforeEnd = (start, end) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return sh < eh || (sh === eh && sm < em);
};

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

exports.isBeforeToday = (date) =>{
  const givenDate = new Date(date);
  const today = new Date();

  givenDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return givenDate < today;
}


/**
 * Formats a time string to "HH:MM" (zero-padded), accepting "H:MM:SS", "HH:MM:SS", "H:MM", or "HH:MM".
 * @param {string} time - The time string.
 * @returns {string} The formatted time string as "HH:MM".
 */
exports.formatToHHMM = (time) => {
    const [h, m] = time.split(":");
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
};

/**
 * Converts a Date object or date string to "YYYY-MM-DD" format.
 * @param {Date|string} date - The date to format.
 * @returns {string} The formatted date string.
 */
exports.formatDateToString = (date) => {

    const d = (date instanceof Date) ? date : new Date(date);
    const retDate = d.toISOString().split('T')[0];
    return retDate
};



exports.normalizeZoomLink = (input)=> {
  const trimmed = input.trim();

  // אם זה קישור אישי עם /my/
  if (trimmed.startsWith("https://zoom.us/my/")) {
    return trimmed;
  }

  // אם זה קישור רגיל עם /j/
  if (trimmed.startsWith("https://zoom.us/j/")) {
    return trimmed;
  }

  // אם זה מזהה פגישה עם רווחים, לדוגמה: "569 171 8831"
  const numericOnly = trimmed.replace(/\s+/g, '');
  if (/^\d{9,11}$/.test(numericOnly)) {
    return `https://zoom.us/j/${numericOnly}`;
  }

  throw new Error("Invalid Zoom link or ID");
}
