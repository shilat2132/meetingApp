const AppError = require('./AppError.js');

/**
 * The global handler for errors, either custom or system-generated.
 */
module.exports = (err, req, res, next) => {
  // Set default status code and status
  console.log(err)
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.code = err.code;

  // SQL / MySQL specific errors
  if (error.code === 'ER_DUP_ENTRY') error = handleMySQLDuplicateEntry(error);
  if (error.code === 'ER_NO_REFERENCED_ROW_2') error = handleMySQLForeignKeyFail(error);
  if (error.code === 'ER_ROW_IS_REFERENCED_2') error = handleMySQLDeleteRestricted(error);
  if (error.code === 'ER_BAD_NULL_ERROR') error = handleMySQLNullInsert(error);
  if (error.code === 'ER_PARSE_ERROR') error = handleMySQLSyntaxError(error);
  if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') error = handleMySQLCheckConstraintViolation(error);
  if(error.code === 'WARN_DATA_TRUNCATED') error = handleSqlAttrError(error)
    if (error.code === 'ER_NO_DEFAULT_FOR_FIELD') {
  error = handleMySQLMissingRequiredField(error);
}



  if (
    error.code === 'UNKNOWN_CODE_PLEASE_REPORT' &&
    error.message?.includes('Check constraint')
  ) {
    error = handleMySQLCheckConstraintViolation(error);
  }

  // JWT specific errors
  if (error.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
  } else if (error.name === 'TokenExpiredError') {
    error = new AppError('Token expired. Please log in again.', 401);
  }

  // Express / general Node errors
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    error = handleJSONSyntaxError(error);
  }

  if (error.name === 'TypeError') error = handleTypeError(error);

  // Separate errors for development and production
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorProd(error, req, res);
  }
};

// ------------ DEV + PROD SENDERS ------------

const sendErrorDev = (err, req, res) => {
  // console.log(err)
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong.',
    });
  }
};

// ------------ HANDLERS FOR SPECIFIC ERRORS ------------

// MySQL Duplicate entry
const handleMySQLDuplicateEntry = (err) => {
  const value = err.message.match(/Duplicate entry '(.+?)'/)?.[1] || '';
  if (err.message.includes('email')){
    return new AppError(`There is already a user with the email ${value}`, 409);
  }

  if (err.message.includes('username')){
    return new AppError(`There is already a user with the username ${value}`, 409);
  }
  return new AppError(`The value "${value}" already exists in the database.`, 400);
};

// Foreign key constraint fails
const handleMySQLForeignKeyFail = (err) => {
  return new AppError("There isn't a user with the given id", 400);
};

// Delete restricted due to foreign key
const handleMySQLDeleteRestricted = (err) => {
  return new AppError('Cannot delete this item because other records depend on it.', 400);
};

// Cannot insert null into a non-null field
const handleMySQLNullInsert = (err) => {
  const field = err.message.match(/Column '(.+?)'/)?.[1] || 'some field';
  return new AppError(`Field "${field}" cannot be null.`, 400);
};

const handleMySQLMissingRequiredField = (err) => {
  const field = err?.sqlMessage?.match(/Field '(.+?)'/)?.[1] || 'unknown field';
  return new AppError(`Field "${field}" is required and cannot be empty.`, 400);
};


// Bad SQL syntax (developer error)
const handleMySQLSyntaxError = (err) => {
  return new AppError('Database syntax error.', 500);
};

const handleSqlAttrError = err=>{
  const message = err.message;

    const match = message.match(/Data truncated for column '(.+?)'/);
    const column = match ? match[1] : null;

    return new AppError(`Invalid data for column: ${column}`, 400);
}

// Check constraint violation
const handleMySQLCheckConstraintViolation = (err) => {
  const constraintName = err.message.match(/constraint '(.+?)'/)?.[1];

  const constraintMessages = {
    user_chk_1: 'Phone number must be exactly 10 digits and contain only numbers.',
    hoursConstraint: 'Meeting start time must be earlier than end time.',
    event_type_chk_1: 'Event max invitees must be greater than 0.',
    event_type_chk_2: 'Event duration time must be greater than 0.',
  };

  const message =
    constraintMessages[constraintName] ||
    `Invalid input. Failed to pass constraint '${constraintName}'. Please verify your data.`;

  return new AppError(message, 400);
};

// JSON parse error in request body
const handleJSONSyntaxError = (err) => {
  return new AppError('Malformed JSON in request body.', 400);
};

// JS runtime type error
const handleTypeError = (err) => {
  return new AppError(err.message, 500);
};
