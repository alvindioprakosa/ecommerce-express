const { getToken } = require('../utils/get-token');
const config = require('../config');
const User = require('../user/model');
const jwt = require('jsonwebtoken');

function decodeToken() {
  return async function (req, res, next) {
    const token = getToken(req);

    if (!token) {
      return next();
    }

    try {
      // Verifikasi dan decode token
      const decoded = jwt.verify(token, config.secretKey);
      req.user = decoded;

      // Cek apakah token masih tersimpan di database (valid session)
      const user = await User.findOne({ token: { $in: [token] } });
      if (!user) {
        return res.status(401).json({
          error: 1,
          message: 'Token tidak ditemukan di database (expired atau logout)'
        });
      }

      return next();
    } catch (err) {
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 1,
          message: err.message
        });
      }

      return next(err);
    }
  };
}

module.exports = {
  decodeToken
};
