const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require("uuid");
const { startOfDay, endOfDay } = require("date-fns");

async function getAttachmentById(requestId) {
  try {
    return await prisma.requestform.findUnique({
      where: { id: requestId },
    });
  } catch (error) {
    console.error("Error fetching attachment", error);
    throw new Error("Error fetching attachment");
  }
}

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

async function addVehicle(data) {
  try {
    const vehicleData = await prisma.vehicles.create({
      data,
    });
    return vehicleData;
  } catch (error) {
    console.error("Error adding vehicle!", error);
    throw new Error("Error adding vehicle");
  }
}

async function updateDriver(driverId, data) {
  try {
    const driverData = await prisma.drivers.update({
      where: {
        id: driverId,
      },
      data: data,
    });
    return driverData;
  } catch (error) {
    console.error("Error updating driver!", error);
    throw new Error("Error updating driver");
  }
}

async function updateVehicle(vehicleId, data) {
  try {
    const driverData = await prisma.vehicles.update({
      where: {
        id: vehicleId,
      },
      data: data,
    });
    return driverData;
  } catch (error) {
    console.error("Error updating vehicle!", error);
    throw new Error("Error updating vehicle");
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

async function getTicketById(ticketId) {
  try {
    return await prisma.requestform.findUnique({
      where: { id: ticketId },
    });
  } catch (error) {
    console.error("Error fetching ticket", error);
    throw new Error("Error fetching ticket");
  }
}

async function deleteVehicle(vehicleId) {
  try {
    const deletedVehicle = await prisma.vehicles.delete({
      where: {
        id: vehicleId,
      },
    });
    return deletedVehicle;
  } catch (error) {
    console.error("Error deleting vehicle", error);
    throw new Error("Error deleting vehicle");
  }
}

async function deleteDriver(driverId) {
  try {
    const deletedDriver = await prisma.drivers.delete({
      where: {
        id: driverId,
      },
    });
    return deletedDriver;
  } catch (error) {
    console.error("Error deleting driver", error);
    throw new Error("Error deleting driver");
  }
}

async function getAllRequestsByDate() {
  try {
    const today = new Date();

    const data = await prisma.requestform.findMany({
      where: {
        departureTime: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
      orderBy: {
        departureTime: "asc",
      },
      include: {
        office: true,
        drivers: true,
      },
    });

    return data;
  } catch (error) {
    console.error("Error fetching today's requests:", error);
    throw error;
  }
}

async function getAllRequestsByRFID(rfid) {
  try {
    const today = new Date();

    const data = await prisma.requestform.findMany({
      where: {
        rfid,
        departureDate: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
      include: {
        office: true,
        drivers: true,
      },
    });

    return data;
  } catch (error) {
    console.error("Error fetching requests by RFID:", error);
    throw error;
  }
}

async function travelOutTime(rfid, requestId) {
  try {
    const updated = await prisma.requestform.updateMany({
      where: {
        id: requestId,
        rfid: rfid,
        travelOut: null,
        departureDate: {
          gte: startOfDay(new Date()),
          lte: endOfDay(new Date()),
        },
      },
      data: {
        travelOut: new Date().toISOString(),
      },
    });

    return updated;
  } catch (error) {
    console.error("Error setting travelOut time:", error);
    throw error;
  }
}

async function travelInTime(rfid, requestId) {
  try {
    const updated = await prisma.requestform.updateMany({
      where: {
        id: requestId,
        rfid: rfid,
        travelOut: {
          not: null,
        },
        travelIn: null,
        departureDate: {
          gte: startOfDay(new Date()),
          lte: endOfDay(new Date()),
        },
      },
      data: {
        travelIn: new Date().toISOString(),
        travelStatus: "Completed",
      },
    });

    return updated;
  } catch (error) {
    console.error("Error setting travelIn time:", error);
    throw error;
  }
}

async function updateTravelOut(rfid, requestId) {
  console.log(
    `updateTravelOut called with rfid: ${rfid}, requestId: ${requestId}`
  );

  const existingRequest = await prisma.requestform.findFirst({
    where: { id: requestId, rfid },
  });

  console.log("Existing request:", existingRequest);

  if (!existingRequest) {
    throw new Error("Request not found.");
  }

  if (existingRequest.travelOut) {
    throw new Error("Travel has already started for this trip.");
  }

  console.log("Updating travelOut for requestId:", requestId);
  return prisma.requestform.update({
    where: { id: requestId },
    data: {
      travelOut: new Date().toISOString(),
      travelStatus: "On Going",
    },
  });
}

async function updateTravelIn(rfid, requestId) {
  console.log(
    `updateTravelIn called with rfid: ${rfid}, requestId: ${requestId}`
  );

  const existingRequest = await prisma.requestform.findFirst({
    where: { id: requestId, rfid },
  });

  console.log("Existing request:", existingRequest);

  if (!existingRequest) {
    throw new Error("Request not found.");
  }

  if (!existingRequest.travelOut) {
    throw new Error("Travel has not started yet. Scan out first.");
  }

  if (existingRequest.travelIn) {
    throw new Error("Travel has already been completed.");
  }

  console.log("Updating travelIn for requestId:", requestId);
  return prisma.requestform.update({
    where: { id: requestId },
    data: {
      travelIn: new Date().toISOString(),
      travelStatus: "Completed",
    },
  });
}

async function getRequestByRFIDAndId(rfid, requestId) {
  try {
    return await prisma.requestform.findFirst({
      where: {
        id: requestId,
        rfid,
      },
    });
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getRequestByRFIDAndId,
  updateTravelOut,
  updateTravelIn,
  travelOutTime,
  travelInTime,
  getAllRequestsByRFID,
  getAllRequestsByDate,
  updateVehicle,
  getTicketById,
  getAttachmentById,
  getVehicleByVehicleId,
  createTicket,
  addOffice,
  addDriver,
  addVehicle,
  fetchAllDrivers,
  fetchAllVehicles,
  fetchAllRequests,
  getDriverByDriverId,
  getOfficeById,
  getAdminEmails,
  addTicket,
  getAllOffices,
  updateDriver,
  updateTicket,
  updateTicketUID,
  deleteVehicle,
  deleteDriver,
};
