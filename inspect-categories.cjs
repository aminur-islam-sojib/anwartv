require("dotenv").config();
const path = require("path");
process.env.NODE_PATH = path.join(__dirname, "src");
require("module").Module._initPaths();
const mongoose = require("mongoose");
const Category = require("./src/Model/Category").default;

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const cats = await Category.find({ isActive: true }).lean();
  // console.log(JSON.stringify(cats, null, 2));
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
