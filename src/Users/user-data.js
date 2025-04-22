const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getUserByUsername(username) {
  try {
    const fetcheduser = await prisma.users.findUnique({
      where: {
        username: username,
      },
    });
    return fetcheduser;
  } catch (error) {
    console.error("Error Authentication", error);
    throw new Error(error);
  }
}

async function getUserById(id) {
  try {
    const fetchedUser = await prisma.users.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    return fetchedUser;
  } catch (error) {
    console.error("Error fetching Users Data", error);
    throw new Error(error);
  }
}

async function getDesignationByID(designationId) {
  try {
    const fetchedDesignation = await prisma.designation.findUnique({
      where: {
        id: designationId,
      },
    });
    return fetchedDesignation;
  } catch (error) {
    console.error("Error Fetching Designation", error);
    throw new Error(error);
  }
}

async function createUser(data) {
  try {
    // Fetch designation's location if designationId is provided
    if (data.designationId) {
      const designation = await prisma.designation.findUnique({
        where: { id: data.designationId },
        select: { name: true },
      });

      if (!designation) {
        throw new Error("Invalid designationId: Not found");
      }
    }

    // Create user
    const createdUser = await prisma.users.create({
      data,
    });

    return createdUser;
  } catch (error) {
    console.error("Error creating user", error);
    throw new Error("Error creating user");
  }
}

async function updateUserById(userId, data) {
  try {
    if (data.editor) delete data.editor;
    if (data.newPassword) delete data.newPassword;

    data.updated_at = new Date();

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data,
    });

    return updatedUser;
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update user");
  }
}

async function deleteUserById(id) {
  try {
    const deletedUser = await prisma.users.delete({
      where: {
        id: parseInt(id),
      },
    });

    return deletedUser;
  } catch (error) {
    console.error("Error fetching Users Data", error);
    throw new Error(error);
  }
}

async function getAllUsers() {
  try {
    const users = await prisma.users.findMany();

    return users;
  } catch (error) {
    console.error("Error fetching Users", error);
    throw new Error(error);
  }
}

async function changeUserPassword(userId, newPassword) {
  try {
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        password: newPassword,
        updated_at: new Date(),
      },
    });

    return updatedUser;
  } catch (error) {
    console.error("Error updating user password:", error);
    throw error;
  }
}

module.exports = {
  changeUserPassword,
  getAllUsers,
  getUserByUsername,
  getUserById,
  getDesignationByID,
  createUser,
  updateUserById,
  deleteUserById,
};
