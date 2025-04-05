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
    throw error;
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

    return newUser;
  } catch (error) {
    console.error("Error during registration:", error);
    throw new Error("Registration failed");
  }
}

module.exports = {
  Authenticate,
  Register,
};
