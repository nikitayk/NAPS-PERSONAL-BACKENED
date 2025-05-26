const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const User = require("../models/User"); // Adjust path to your User model
require("dotenv").config();

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || "your_jwt_secret", // Use env variable
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      // Find the user specified in token
      const user = await User.findById(jwt_payload.id).select("-password");
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);

const initializePassport = () => passport.initialize();

const authenticateJwt = () => passport.authenticate("jwt", { session: false });

module.exports = {
  initializePassport,
  authenticateJwt
};
