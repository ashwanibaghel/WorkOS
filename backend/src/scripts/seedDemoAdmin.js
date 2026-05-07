import mongoose from "mongoose";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

const demoAdmin = {
  name: "Demo Admin",
  email: "demo.admin@workos.com",
  password: "Demo@12345"
};

const seedDemoAdmin = async () => {
  await mongoose.connect(env.mongoUri);

  let user = await User.findOne({ email: demoAdmin.email }).select("+password");

  if (!user) {
    user = new User({
      name: demoAdmin.name,
      email: demoAdmin.email,
      password: demoAdmin.password,
      role: "admin",
      authProvider: "local",
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    });
  } else {
    user.name = demoAdmin.name;
    user.password = demoAdmin.password;
    user.role = "admin";
    user.authProvider = "local";
    user.isEmailVerified = true;
    user.emailVerifiedAt = user.emailVerifiedAt || new Date();
  }

  await user.save();

  console.log(`Demo admin is ready: ${demoAdmin.email}`);
};

seedDemoAdmin()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
