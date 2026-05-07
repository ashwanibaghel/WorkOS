import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { emailService } from "./emailService.js";

const signToken = (user) =>
  jwt.sign({ sub: user._id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;
const VERIFICATION_EXPIRES_MS = 24 * 60 * 60 * 1000;

const ensureAdminExists = async (user) => {
  if (user.role === "admin") return user;
  const adminExists = await User.exists({ role: "admin" });
  if (adminExists) return user;
  return User.findByIdAndUpdate(user._id, { role: "admin" }, { new: true });
};

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const createVerificationToken = async (user) => {
  const token = crypto.randomBytes(32).toString("hex");
  user.emailVerificationTokenHash = hashToken(token);
  user.emailVerificationExpiresAt = new Date(Date.now() + VERIFICATION_EXPIRES_MS);
  await user.save();
  return token;
};

const verificationUrlFor = (token) => `${env.clientUrl}/verify-email?token=${token}`;

const sendVerification = async (user) => {
  const token = await createVerificationToken(user);
  const result = await emailService.sendVerificationEmail({
    to: user.email,
    name: user.name,
    verificationUrl: verificationUrlFor(token)
  });

  return {
    verificationRequired: true,
    emailSent: result.sent,
    ...(result.devVerificationUrl ? { devVerificationUrl: result.devVerificationUrl } : {})
  };
};

export const authService = {
  async signup({ name, email, password }) {
    const exists = await User.exists({ email });
    if (exists) throw new AppError("Email is already registered", 409);

    const usersCount = await User.estimatedDocumentCount();
    const user = await User.create({
      name,
      email,
      password,
      role: usersCount === 0 ? "admin" : "member",
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    });
    const trustedUser = await ensureAdminExists(user);
    return { user: trustedUser, token: signToken(trustedUser) };
  },

  async login({ email, password }) {
    const user = await User.findOne({ email }).select("+password +emailVerificationTokenHash");
    if (!user || user.authProvider !== "local" || !user.password || !(await user.comparePassword(password))) {
      throw new AppError("Invalid email or password", 401);
    }

    const trustedUser = await ensureAdminExists(user);
    return { user: trustedUser, token: signToken(trustedUser) };
  },

  async verifyEmail(token) {
    const user = await User.findOne({
      emailVerificationTokenHash: hashToken(token),
      emailVerificationExpiresAt: { $gt: new Date() }
    }).select("+emailVerificationTokenHash +emailVerificationExpiresAt");

    if (!user) throw new AppError("Verification link is invalid or expired", 400);

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();

    const trustedUser = await ensureAdminExists(user);
    return { user: trustedUser, token: signToken(trustedUser) };
  },

  async resendVerification({ email }) {
    const user = await User.findOne({ email });
    if (!user || user.authProvider !== "local" || user.isEmailVerified) {
      return { verificationRequired: false, message: "If verification is needed, a new email has been sent." };
    }

    const verification = await sendVerification(user);
    return { ...verification, message: "Verification email sent." };
  },

  async googleLogin({ credential }) {
    if (!googleClient) {
      throw new AppError("Google OAuth is not configured. Set GOOGLE_CLIENT_ID.", 503);
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.googleClientId
    });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload?.sub) {
      throw new AppError("Google login failed: invalid Google profile", 401);
    }

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      const usersCount = await User.estimatedDocumentCount();
      user = await User.create({
        name: payload.name || payload.email.split("@")[0],
        email: payload.email,
        authProvider: "google",
        googleId: payload.sub,
        avatar: payload.picture,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        role: usersCount === 0 ? "admin" : "member"
      });
    } else {
      user = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            googleId: user.googleId || payload.sub,
            avatar: payload.picture || user.avatar,
            isEmailVerified: true,
            emailVerifiedAt: user.emailVerifiedAt || new Date()
          }
        },
        { new: true }
      );
    }

    const trustedUser = await ensureAdminExists(user);
    return { user: trustedUser, token: signToken(trustedUser) };
  }
};
