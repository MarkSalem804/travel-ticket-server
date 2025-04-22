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
  } catch (error) {
    console.error("Registration Error:", error);

    return res.status(404).json({
      success: false,
      message: error.message || "Authentication Failed",
    });
  }
});

userRouter.post("/Registration", async (req, res) => {
  try {
    const newUser = await userService.Register(req.body);

    return res.status(201).json(newUser);
  } catch (error) {
    console.error("Registration Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
});

userRouter.get("/getAllUsers", async (req, res) => {
  try {
    const data = await userService.fetchAllUsers();
    return res.status(201).json(data);
  } catch (error) {
    console.error("Registration Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "fetching failed",
    });
  }
});

userRouter.patch("/changePassword/:id", async (req, res) => {
  const { id } = req.params;

  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: "New password is required." });
  }

  try {
    const updatedUser = await userService.changePassword(
      parseInt(id),
      newPassword
    );
    res
      .status(200)
      .json({ message: "Password updated successfully.", user: updatedUser });
  } catch (error) {
    console.error("Internal Server error", error);
    res.status(500).json({ error: "Failed to update password." });
  }
});

userRouter.put("/UpdateUser/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const userData = req.body;

    const updatedUser = await userService.updateUser(userId, userData);

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Route: Failed to update user", error);
    res.status(500).json({
      message: "Failed to update user",
      error: error.message,
    });
  }
});

module.exports = userRouter;
