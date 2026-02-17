import { regSchema } from "../validations/register.validate.js";
import { loginSchema } from "../validations/login.vlidate.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Face from "../models/Face.js";
import VerificationPin from "../models/VerificationPin.js";
import { z } from "zod";
import { newAccessToken, newRefreshToken } from "../utils/functions.js";
import { generateRef } from "../utils/generateRef.js";
import bcrypt from "bcrypt";
import mailer from "../utils/mailer.js";
import RefreshToken from "../models/RefreshToken.js";
import { BadRequestError, STATUS_CODE } from "../errors/error.js";

// register logic
export const register = async (req, res) => {
  const { firstname, lastname, matricNumber, email, department, password } =
    regSchema.parse(req.body);

  // check if user exitss already
  const userExits = await User.findOne({ email }).select("-password");
  if (userExits) throw BadRequestError("Email already Exists");
  // check if matric number exists
  const matricExits = await User.findOne({ matricNumber }).select("-password");
  if (matricExits) throw BadRequestError("Matric Number already Exists");

  // encrypt password

  const hashedPassword = await bcrypt.hash(password, 13);

  const user = new User({
    firstname,
    lastname,
    email,
    matricNumber,
    department,
    password: hashedPassword,
  });
  const access_token = newAccessToken(user);
  const refresh_token = newRefreshToken(user);

  await user.save();

  const refreshToken = new RefreshToken({
    token: refresh_token,
    user: user._id,
  });

  await refreshToken.save();
  const { password: pwd, ...userData } = user._doc;

  return res.status(STATUS_CODE.CREATED).json({
    message: "User Registered Successfully",
    user: userData,
    access_token,
    refresh_token,
  });
};
// Send and Resend Verification Pin  Logic
export const sendVerificationPin = async (req, res) => {
  const user = req.user;

  const name = `${user.firstname + " " + user.lastname}`.trim();
  const expires_in = "10";
  const code = generateRef(6);

  // delete old ones
  await VerificationPin.deleteMany({ user: user._id });

  // store in db
  const verificationPin = new VerificationPin({
    pin: code,
    user: user._id,
  });
  await verificationPin.save();

  await mailer(
    user.email,
    "Email Verification Code",
    verificationPin.pin,
    name,
    expires_in,
  );

  return res.status(STATUS_CODE.SUCCESS).json({
    message: "Code has been sent to your email",
  });
};
// verify email
export const verifyEmail = async (req, res) => {
  const user = req.user;

  const { pin } = req.body;

  if (user.email_verified_at) {
    return res
      .status(STATUS_CODE.SUCCESS)
      .json({ message: "Email already verified" });
  }

  // validate pin
  if (!pin || pin.length < 6 || pin.length > 6) {
    throw BadRequestError("Incorrect Pin Syntax");
  }

  // validate pin
  const isPin = await VerificationPin.findOne({ pin, user: user._id });
  if (!isPin) {
    throw BadRequestError("Incorrect Pin");
  }

  await User.updateOne({ _id: user._id }, { email_verified_at: new Date() });

  await VerificationPin.deleteOne({ user: user._id });

  return res.status(STATUS_CODE.SUCCESS).json({
    message: "Email Verified Successfully",
  });
};
// login logic
export const login = async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  // check for User
  const user = await User.findOne({ email });

  if (!user) {
    throw BadRequestError("Invalid email or password");
  }

  // confirm password
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    // return res.status(400).json({ error: "Invalid email or password" });
    throw BadRequestError("Invalid password");
  }

  const access_token = newAccessToken(user);
  const refresh_token = newRefreshToken(user);
  // update refresh token
  await RefreshToken.updateOne({ user: user._id }, { token: refresh_token });

  // check if user registered face
  let faceExists;
  const face = await Face.findOne({ user: user._id });
  if (face == null) {
    faceExists = false;
  } else {
    faceExists = true;
  }

  const { password: pwd, ...userData } = user._doc;
  userData.faceExists = faceExists;

  return res.status(STATUS_CODE.CREATED).json({
    message: "User Logged In Successfully",
    user: userData,
    access_token,
    refresh_token,
  });
};
// new token logic
export const newToken = async (req, res) => {
  const user = req.user;

  // check if user logged out
  const loggedOut = await RefreshToken.findOne({ user: user._id });
  if (loggedOut.token == "") throw BadRequestError("User already Logged out");

  // generate token
  const token = newAccessToken(user);

  return res.status(STATUS_CODE.CREATED).json({ access_token: token });
};
// get all attendance
export const updatePassword = async (req, res) => {
  const user = req.user;

  const { currentPassword, newPassword } = req.body;
  if (
    !currentPassword ||
    !newPassword ||
    currentPassword.trim() == "" ||
    newPassword.trim() == ""
  ) {
    throw BadRequestError("All fields must be filled");
  }
  if (currentPassword == newPassword) {
    throw BadRequestError("Passwords must be Different");
  }
  const userPassword = await User.findOne({ email: user.email }).select(
    "password",
  );
  const passwordMatch = await bcrypt.compare(
    currentPassword,
    userPassword.password,
  );

  if (!passwordMatch) {
    throw BadRequestError("Invalid Password");
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 13);

  await User.updateOne({ email: user.email }, { password: hashedNewPassword });

  return res
    .status(STATUS_CODE.SUCCESS)
    .json({ message: "Password Updated Successfulll" });
};
// delete profile logic
export const deleteUser = async (req, res) => {
  const user = req.user;

  // delete user-related records
  await RefreshToken.deleteMany({ user: user._id });
  await Attendance.deleteMany({ user: user._id });
  await Face.deleteMany({ user: user._id });

  // delete actual user account
  await User.deleteOne({ _id: user._id });

  return res
    .status(STATUS_CODE.SUCCESS)
    .json({ message: "User Deleted Successfulll" });
};
// logout logic
export const logout = async (req, res) => {
  const user = req.user;

  await RefreshToken.updateOne({ user: user._id }, { token: "" });

  return res
    .status(STATUS_CODE.SUCCESS)
    .json({ message: "Logged Out Successfully" });
};

export const getMe = async (req, res) => {
  const user = req.user;
  let faceExists;
  const face = await Face.findOne({ user: user._id });
  if (face == null) {
    faceExists = false;
  } else {
    faceExists = true;
  }
  return res
    .status(STATUS_CODE.SUCCESS)
    .json({ user: { ...user, faceExists } });
};
