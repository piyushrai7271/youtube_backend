// here we are defining standerd class that we will need these things if error comes in our whole project
class ApiError extends Error {
  constructor(
    statusCode,
    message = "Somthing went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors

    if(stack){
        this.stack = stack
    } else{
        Error.captureStackTrace(this,this.constructor)
    }
  }
}

export {ApiError}
