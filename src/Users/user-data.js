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

module.exports = {
  getUserByUsername,
  getDesignationByID,
  createUser,
};
