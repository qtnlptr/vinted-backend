const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const User = require("../models/User");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

/// Sign Up

router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    const { username, email, password, newsletter } = req.body;
    const existingUser = await User.findOne({ email: email });
    const existingUsername = await User.findOne({
      username: username,
    });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    } else if (!password) {
      return res.status(400).json({ message: "Please enter a valid password" });
    } else if (username === "" || !username) {
      return res.status(400).json({ message: "Please enter a valid username" });
    } else if (existingUsername) {
      return res.status(409).json({ message: "Username already taken" });
    }
    const salt = uid2(16);
    const hash = SHA256(req.body.password + salt).toString(encBase64);
    const token = uid2(64);

    const newUser = new User({
      email: email,
      account: { username: username },
      newsletter: newsletter,
      hash: hash,
      salt: salt,
      token: token,
    });
    const pictureToUpload = convertToBase64(req.files.avatar);
    const productImage = await cloudinary.uploader.upload(pictureToUpload, {
      folder: `vinted/avatars/${newUser._id}`,
    });

    newUser.account.avatar = {
      secure_url: productImage.secure_url,
    };

    await newUser.save();
    return res.status(201).json({
      _id: newUser._id,
      token: newUser.token,
      account: newUser.account,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "No account found with this email address" });
    }
    const passwordToTest = SHA256(password + user.salt).toString(encBase64);
    if (passwordToTest !== user.hash) {
      res.status(400).json({ message: "Password is incorrect" });
    } else if (passwordToTest === user.hash) {
      return res
        .status(200)
        .json({ id: user.id, token: user.token, account: user.account });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
