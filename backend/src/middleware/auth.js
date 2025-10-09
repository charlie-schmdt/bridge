// Temporary middleware that just passes through
module.exports = async function auth(req, res, next) {
  // Just pass through for now
  next();
};
