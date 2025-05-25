import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from "passport-jwt";
import User from "../models/User"; // Adjust path to your User model
import dotenv from "dotenv";

dotenv.config();

const opts: StrategyOptions = {
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

export const initializePassport = () => passport.initialize();

export const authenticateJwt = () => passport.authenticate("jwt", { session: false });
