// here we will use two way 1).using promise  2).using async await......
// Using promis...

const asyncHandler = (requestHandler) => {
  return (req, resp, next) => {
    Promise.resolve(requestHandler(req, resp, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// using async await.....
// const asyncHandler = () =>{}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => {()=>}
// this is how this lower function is define

// const asyncHandler = (fn) => async(req,resp,next) => {
//     try {
//         await fn(req,resp,next)
//     } catch (error) {
//         req.status(err.code || 500).json({
//             success:false,
//             message:err.message
//         })
//     }
// }
