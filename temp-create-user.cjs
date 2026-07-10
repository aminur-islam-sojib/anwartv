require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/Model/User.ts").default;

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const email = "admin@example.com";
  const existing = await User.findOne({ email });
  if (!existing) {
    const hashed = await bcrypt.hash("123456", 10);
    await User.create({
      name: "Admin",
      email,
      password: hashed,
      role: "admin",
    });
    console.log("created");
  } else {
    console.log("exists");
  }
  await mongoose.disconnect();
})();
