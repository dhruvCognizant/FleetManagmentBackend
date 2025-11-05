const logger = (req, res, next) => {
  console.log(`${req.method} - ${req.url}`);
  next();
};
const errorWare = (req, res, next) => {
  res.status(404).json({ error: 'Page not found' });
};
module.exports = { logger , errorWare};
