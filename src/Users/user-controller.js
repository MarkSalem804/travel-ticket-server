const userService = require("../Users/user-service");
const verifyToken = require("../Utils/jwt");
const tokenGenerate = require("../Utils/jwt");
const express = require("express");
const userRouter = express.Router();
const authToken = require("../Middlewares/jwtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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

// userRouter.post("/Authentication", async (req, res) => {
//   try {
//     const body = req.body;

//     if (!body.username || !body.password) {
//       throw new Error("Username and password are Required");
//     }

//     const user = await userService.Authenticate(body.username, body.password);

//     if (!user) {
//       throw new Error("Invalid credentials");
//     }

//     const accessToken = tokenGenerate.generateAccessToken(user);
//     const refreshToken = tokenGenerate.generateRefreshToken(user);

//     // Save refreshToken in DB
//     await prisma.users.update({
//       where: { id: user.id },
//       data: { refreshToken },
//     });

//     // Set refresh token in HTTP-only cookie
//     res.cookie("refreshToken", refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production", // send over HTTPS in production
//       sameSite: "Strict", // or "Lax" if using with frontend on same domain
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     });

//     return res.status(200).json({
//       valid: true,
//       message: "Login successful",
//       accessToken,
//       user: {
//         id: user.id,
//         username: user.username,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error("Authentication Error:", error);
//     return res.status(401).json({ success: false, message: error.message });
//   }
// });

userRouter.post("/logout", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(204); // No content

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Clear DB token
    await prisma.users.update({
      where: { id: payload.id },
      data: { refreshToken: "" },
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch {
    return res.sendStatus(403);
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
    return res.status(200).json(data);
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
    const updatedUser = await userService.updateUser(
      parseInt(req.params.id),
      req.body
    );
    return res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update user", error: error.message });
  }
});

//FOR TOKEN RENEWAL
userRouter.post("/token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(401);

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await prisma.users.findUnique({ where: { id: payload.id } });

    if (!user || user.refreshToken !== refreshToken) {
      return res.sendStatus(403);
    }

    const newAccessToken = authToken.generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.sendStatus(403);
  }
});

module.exports = userRouter;
