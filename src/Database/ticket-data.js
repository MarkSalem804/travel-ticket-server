const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function addOffice(data) {
  try {
    const officeData = await prisma.offices.create({
      data,
    });
    return officeData;
  } catch (error) {
    console.error("Error creating office!", error);
    throw new Error("Error creating office");
  }
}

async function addDriver(data) {
  try {
    const driverData = await prisma.drivers.create({
      data,
    });
    return driverData;
  } catch (error) {
    console.error("Error adding driver!", error);
    throw new Error("Error adding driver");
  }
}

async function getAdminEmails() {
  try {
    const admins = await prisma.users.findMany({
      where: { role: "Admin" },
      select: { email: true },
    });
    return admins.map((admin) => admin.email);
  } catch (error) {
    console.error("Error fetching admin emails!", error);
    throw new Error("Error fetching admin emails");
  }
}

async function getAllOffices() {
  try {
    const offices = await prisma.offices.findMany();
    return offices;
  } catch (error) {
    console.error("Error fetching offices!", error);
    throw new Error("Error fetching offices");
  }
}

async function getDriverByDriverId(driverId) {
  try {
    const parsedDriverId = parseInt(driverId);
    if (!parsedDriverId) {
      console.log("required driverId");
    }

    const driver = await prisma.drivers.findFirst({
      where: {
        id: parsedDriverId,
      },
      select: {
        driverName: true,
        email: true,
        contactNo: true,
      },
    });

    return driver;
  } catch (error) {
    console.error("Error retrieving driver data! ", error);
    throw new Error("Error retrieving driver data");
  }
}

async function getOfficeById(officeId) {
  try {
    const office = await prisma.offices.findFirst({
      where: {
        id: parseInt(officeId),
      },
    });
    return office;
  } catch (error) {
    console.error("Error retrieving office data! ", error);
    throw new Error("Error retrieving office data");
  }
}

async function addTicket(data) {
  try {
    const ticketData = await prisma.requestform.create({ data: data });

    return ticketData;
  } catch (error) {
    console.error("Error submitting ticket! ", error);
    throw new Error("Error submitting ticket");
  }
}

async function updateTicket(ticketId, updatedData) {
  try {
    const updatedTicket = await prisma.requestform.update({
      where: {
        id: ticketId,
      },
      data: updatedData,
    });
    return updatedTicket;
  } catch (error) {
    console.error("Error submitting ticket! ", error);
    throw new Error("Error submitting ticket");
  }
}

module.exports = {
  addOffice,
  addDriver,
  getDriverByDriverId,
  getOfficeById,
  getAdminEmails,
  addTicket,
  getAllOffices,
  updateTicket,
};
