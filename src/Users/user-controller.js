const userService = require("../Users/user-service");
const express = require("express");
const userRouter = express.Router();

userRouter.post("/Authentication", async (req, res) => {
  try {
    const body = req.body;

    if (!body.username || !body.password) {
      throw new Error("Username and password are Required");
    }

    const user = await userService.Authenticate(body.username, body.password);

    if (!user) {
      const error = new Error("Invalid Password");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).send({
      valid: true,
      message: "Login successful",
      data: user,
    });
  } catch (error) {}
});

userRouter.post("/Registration", async (req, res) => {
  try {
    const newUser = await userService.Register(req.body);

    return res.status(201).json({
      success: true,
      message: "User Registered Successfully!",
      data: newUser,
    });
  } catch (error) {
    console.error("Registration Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
});

module.exports = userRouter;
