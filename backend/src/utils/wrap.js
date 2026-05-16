export const wrap = (handler) => async (req, res, next) => {
  try {
    return await handler(req, res, next);
  } catch (err) {
    return next(err);
  }
};
