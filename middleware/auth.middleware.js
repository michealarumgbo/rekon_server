import User from "../models/User.js";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import RefreshToken from "../models/RefreshToken.js";
import {
  BadRequestError,
  NotFoundError,
  UnAuthenticatedError,
  UnauthourizedError,
} from "../errors/error.js";

dotenv.config();
export const auth = (jwt_secret = process.env.JWT_ACCESS_SECRET) => {
  return async (req, res, next) => {
    // extract token from authorization haeder
    const authHeader = req.get("Authorization");

    //   check if token is not like "Bearer uefif..."
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(403)
        .json({ error: "Unauthorized Access or Invalid Token" });
    }

    //   get and modify token
    const token = authHeader.replace("Bearer ", "");

    const decoded = jwt.verify(token, jwt_secret);
    if (!decoded || !decoded.id) {
      throw UnauthourizedError("Invalid or expired token");
    }
    // add user to req body
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      throw NotFoundError("User no longer exists");
    }

    // user has to be logged in
    const isLoggedIn = await RefreshToken.findOne({
      user: decoded.id,
    }).select("token");
    if (!isLoggedIn || !isLoggedIn.token) {
      throw UnauthourizedError("User is already logged out");
    }

    req.user = user;
    next();
  };
};
export const isAdmin = (jwt_secret = process.env.JWT_ACCESS_SECRET) => {
  return async (req, res, next) => {
    // extract token from authorization haeder
    const authHeader = req.get("Authorization");

    //   check if token is not like "Bearer uefif..."
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw UnAuthenticatedError("Unauthorized Access or Invalid Token");
    }

    //   get and modify token
    const token = authHeader.replace("Bearer ", "");

    const decoded = jwt.verify(token, jwt_secret);
    if (!decoded || !decoded.id) {
      throw UnAuthenticatedError("Invalid or expired token");
    }
    // add user to req body
    const user = await Admin.findById(decoded.id).select("-password");
    if (!user) {
      throw NotFoundError("User no longer exists");
    }

    // user has to be logged in
    const isLoggedIn = await RefreshToken.findOne({
      user: decoded.id,
    }).select("token");
    if (!isLoggedIn || !isLoggedIn.token) {
      throw UnAuthenticatedError("User is already logged out");
    }

    req.user = user;
    next();
  };
};
