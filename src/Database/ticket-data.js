const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require("uuid");

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

async function getVehicleByVehicleId(vehicleId) {
  try {
    const parsedVehicleId = parseInt(vehicleId);
    if (!parsedVehicleId) {
      console.log("required vehicleId");
    }

    const driver = await prisma.vehicles.findFirst({
      where: {
        id: parsedVehicleId,
      },
      select: {
        vehicleName: true,
        rfid: true,
        plateNo: true,
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

async function updateTicket(ticketId, data) {
  // First, update the requestform
  const updatedRequestForm = await prisma.requestform.upsert({
    where: { id: ticketId }, // Use the `id` of requestform to match
    update: { ...data },
    create: {
      ...data,
      id: ticketId,
      // Remove generatedUID from here since it belongs in the `tickets` table
    },
  });

  // If the status is "Approved", handle the `generatedUID` in the `tickets` table
  if (data.status === "Approved") {
    const uniqueUID = uuidv4(); // Generate UID

    // Insert or update the `generatedUID` in the `tickets` table
    await prisma.tickets.upsert({
      where: { id: ticketId }, // Assuming `ticketId` corresponds to `id` in `tickets` table
      update: { generatedUID: uniqueUID }, // Update the generatedUID
      create: {
        id: ticketId,
        generatedUID: uniqueUID,
        status: "Approved", // Ensure that other required fields are created if necessary
      },
    });
  }

  return updatedRequestForm;
}

// Create new ticket entry in `tickets` table
async function createTicket(requestFormId, uniqueUID) {
  return await prisma.tickets.create({
    data: {
      id: requestFormId, // Use the `id` of requestform as foreign key
      generatedUID: uniqueUID,
      status: "Approved",
      created_at: new Date(),
    },
  });
}

// Update or create a ticket if not found (based on `id`)
async function updateTicketUID(requestFormId, uniqueUID, status) {
  return await prisma.tickets
    .update({
      where: { id: requestFormId }, // Use `id` here
      data: {
        generatedUID: uniqueUID,
        requestFormId: requestFormId,
        status,
        updated_at: new Date(),
      },
    })
    .catch(async (error) => {
      if (error.code === "P2025") {
        // If no ticket exists, create a new one
        return await prisma.tickets.create({
          data: {
            id: requestFormId, // Use `id` here to link the ticket to the requestform
            generatedUID: uniqueUID,
            requestFormId: requestFormId,
            status,
            created_at: new Date(),
          },
        });
      }
      throw error;
    });
}

async function fetchAllRequests() {
  try {
    const fetchedData = await prisma.requestform.findMany({
      orderBy: {
        created_at: "desc", // Assuming your field is named 'createdAt'
      },
    });
    return fetchedData;
  } catch (error) {
    console.error("Error fetching requests! ", error);
    throw new Error("Error fetching requests");
  }
}

async function fetchAllVehicles() {
  try {
    const fetchedData = await prisma.vehicles.findMany();
    return fetchedData;
  } catch (error) {
    console.error("Error fetching vehicles! ", error);
    throw new Error("Error fetching vehicles");
  }
}

async function fetchAllDrivers() {
  try {
    const fetchedDrivers = await prisma.drivers.findMany();
    return fetchedDrivers;
  } catch (error) {
    console.error("Error fetching drivers! ", error);
    throw new Error("Error fetching drivers");
  }
}

module.exports = {
  getVehicleByVehicleId,
  createTicket,
  addOffice,
  addDriver,
  fetchAllDrivers,
  fetchAllVehicles,
  fetchAllRequests,
  getDriverByDriverId,
  getOfficeById,
  getAdminEmails,
  addTicket,
  getAllOffices,
  updateTicket,
  updateTicketUID,
};
