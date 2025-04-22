const userdata = require("../Users/user-data");
const bcrypt = require("bcryptjs");

async function Authenticate(username, password) {
  try {
    const user = await userdata.getUserByUsername(username);
    if (!user) {
      const error = new Error("User not found!");
      error.statusCode = 404;
      throw error;
    }

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      const error = new Error("Invalid Password");
      error.statusCode = 401;
      throw error;
    }

    return user;
  } catch (error) {
    console.error("Error during authentication:", error);
    throw new Error("Authentication failed");
  }
}

async function Register(body) {
  try {
    const existingUser = await userdata.getUserByUsername(body.username);
    if (existingUser) {
      throw new Error("Username Already Exists");
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    let designation = null;
    if (body.designationId) {
      designation = await userdata.getDesignationByID(body.designationId);
    }

    const newUser = await userdata.createUser({
      ...body,
      password: passwordHash,
      designationId: body.designationId || null,
    });

    const { password, ...safeUser } = newUser;
    return safeUser;
  } catch (error) {
    console.error("Error during registration:", error);
    throw new Error("Registration failed");
  }
}

async function fetchAllUsers() {
  try {
    const fetchedUsers = await userdata.getAllUsers();
    return fetchedUsers;
  } catch (error) {
    console.error("Error during fetching:", error);
    throw new Error("fetching failed");
  }
}

async function changePassword(userId, newPassword) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10); // 10 is the salt rounds
    const updatedUser = await userdata.changeUserPassword(
      userId,
      hashedPassword
    );
    return updatedUser;
  } catch (error) {
    console.error("Error in changePassword service:", error);
    throw error;
  }
}

async function updateUser(id, userData) {
  try {
    const updatedUser = await userdata.updateUserById(id, userData);
    return updatedUser;
  } catch (err) {
    console.error("Service: Failed to update user", err);
    throw new Error("Could not update user");
  }
}

module.exports = {
  updateUser,
  changePassword,
  fetchAllUsers,
  Authenticate,
  Register,
};
