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

async function updateUser(id, data, office) {
  try {
    if (data.editor) {
      delete data.editor;
    }
    if (data.newPassword) {
      delete data.newPassword;
    }

    let updatedUser;

    if (!office) {
      updatedUser = await prisma.users.update({
        where: {
          id: id,
        },
        data: {
          ...data,
          officeId: null,
          officeName: null,
        },
      });
    } else {
      updatedUser = await prisma.users.update({
        where: {
          id: id,
        },
        data: {
          ...data,
          officeId: office.id,
          officeName: office.officeName,
        },
      });
    }

    return updatedUser;
  } catch (error) {
    console.error("Error creating user", error);
    throw new Error(error);
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

module.exports = {
  getUserByUsername,
  getUserById,
  getDesignationByID,
  createUser,
  updateUser,
  deleteUserById,
};
