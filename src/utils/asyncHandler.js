// TODO:🤔 Toh fir asyncHandler ka kya fayda?
// Uska kaam try-catch hataana hai, async hataana nahi.

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// // higher order fns : fn ko variable ki tarah treat karte hai
// TODO: jo ham bar bar try-catch ke andar jo async await likhte hai usko bar bar na likhana pade isliye ham ye use karte hai
// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: true,
//       message: error.message,
//     }); 
//   }
// };
