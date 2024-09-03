const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_APISECRET,
});

const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");

app.use(userRoutes);
app.use("/offer", offerRoutes);

app.get("/", (req, res) => {
  res.status(200).json("bienvenue");
});

app.all("*", (req, res) => {
  res.status(404).json({ message: "Page not found" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
