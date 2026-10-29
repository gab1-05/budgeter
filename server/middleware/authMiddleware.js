const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production';

module.exports = function(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'No token' });
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET);
    req.userId = payload.id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};