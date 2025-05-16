const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../user/model');
const config = require('../config');
const { getToken } = require('../utils/get-token');

// Check current authenticated user
function me(req, res) {
  if (!req.user) {
    return res.json({
      error: 1,
      message: `You're not logged in or token expired`
    });
  }

  res.json(req.user);
}

// Local strategy for Passport
async function localStrategy(email, password, done) {
  try {
    const user = await User.findOne({ email })
      .select('-__v -createdAt -updatedAt -cart_items -token');

    if (!user) return done(null, false);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return done(null, false);

    const { password: _, ...userWithoutPassword } = user.toJSON();
    return done(null, userWithoutPassword);
  } catch (err) {
    return done(err, false);
  }
}

// User registration
async function register(req, res, next) {
  try {
    const user = new User(req.body);
    await user.save();
    res.json(user);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.json({
        error: 1,
        message: err.message,
        fields: err.errors
      });
    }
    next(err);
  }
}

// User login
function login(req, res, next) {
  passport.authenticate('local', async (err, user) => {
    if (err) return next(err);
    if (!user) return res.json({ error: 1, message: 'Email or password incorrect' });

    const token = jwt.sign(user, config.secretKey);
    await User.findByIdAndUpdate(user._id, { $push: { token } });

    res.json({
      message: 'Logged in successfully',
      user,
      token
    });
  })(req, res, next);
}

// User logout
async function logout(req, res) {
  const token = getToken(req);

  if (!token) {
    return res.json({ error: 1, message: 'Token tidak ditemukan' });
  }

  const user = await User.findOneAndUpdate(
    { token: { $in: [token] } },
    { $pull: { token } }
  );

  if (!user) {
    return res.json({ error: 1, message: 'User tidak ditemukan' });
  }

  res.json({ error: 0, message: 'Logout berhasil' });
}

module.exports = {
  register,
  localStrategy,
  login,
  me,
  logout
};
