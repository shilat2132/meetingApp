class AppError extends Error{
    constructor(err, statusCode){
        let message
        

        if (typeof err === "string") {
            message = err
        } else{
            message = err.message
            
        }
        super(message);

        if(typeof err === "object"){
            this.code = err.code
        }
        
        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        this.isOperational = true

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
