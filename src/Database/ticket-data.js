const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require("uuid");
const { startOfDay, endOfDay } = require("date-fns");
const { getTodayDateRange } = require("../Utils/dateconf");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

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
    const { start, end } = getTodayDateRange(); // Get local start and end

    // Convert local start and end to UTC manually
    const startUtc = new Date(
      start.getTime() - start.getTimezoneOffset() * 60000
    );
    const endUtc = new Date(end.getTime() - end.getTimezoneOffset() * 60000);

    console.log("startUtc:", startUtc.toISOString());
    console.log("endUtc:", endUtc.toISOString());

    const data = await prisma.requestform.findMany({
      where: {
        departureTime: {
          gte: startUtc,
          lt: endUtc,
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

    console.log("Fetched data:", data);
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

async function getAllRequestsByRFIDandId(rfid, requestId) {
  try {
    const today = new Date();

    const data = await prisma.requestform.findMany({
      where: {
        rfid,
        id: requestId,
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
        rfid,
        id: requestId,
      },
    });
  } catch (error) {
    throw error;
  }
}

// when rfid tapped on reader first time (out)
// async function urgentTripOut(rfid) {
//   try {
//     if (rfid) {
//       const vehicle = await prisma.vehicles.findFirst({
//         where: { rfid },
//         select: {
//           assigned: true,
//           plateNo: true,
//           type: true,
//           vehicleName: true,
//         },
//       });
//       if (vehicle) {
//         // Create a new urgent trip with DEPARTURE time
//         const newUrgentTrip = await prisma.urgentTrips.create({
//           data: {
//             rfid: rfid,
//             driverName: vehicle.assigned, // assigned from vehicles table
//             plateNo: vehicle.plateNo,
//             vehicleName: vehicle.vehicleName,
//             departure: new Date(), // set departure now
//             arrival: null, // arrival empty for now
//           },
//         });

//         return newUrgentTrip;
//       } else {
//         throw new Error("Vehicle not found for the given RFID");
//       }
//     }
//   } catch (error) {
//     console.error("Error in urgentTripOut:", error);
//     throw error;
//   }
// }

// When RFID is detected for arrival (in)
// async function urgentTripIn(rfid) {
//   try {
//     if (rfid) {
//       // Find the latest urgentTrip for this RFID where arrival is still NULL
//       const existingTrip = await prisma.urgentTrips.findFirst({
//         where: {
//           rfid: rfid,
//           arrival: null,
//         },
//         orderBy: {
//           departure: "desc", // just in case, get the latest departure
//         },
//       });

//       if (existingTrip) {
//         // Update the arrival time
//         const updatedTrip = await prisma.urgentTrips.update({
//           where: {
//             id: existingTrip.id,
//           },
//           data: {
//             arrival: new Date(),
//           },
//         });

//         return updatedTrip;
//       } else {
//         throw new Error(
//           "No ongoing urgent trip found for this RFID to set arrival"
//         );
//       }
//     }
//   } catch (error) {
//     console.error("Error in urgentTripIn:", error);
//     throw error;
//   }
// }

async function getAllUrgents() {
  try {
    const data = await prisma.urgentTrips.findMany();
    return data;
  } catch (error) {
    throw error;
  }
}

async function urgentTap(rfid) {
  try {
    const COOLDOWN_SECONDS = 5; // 5 seconds cooldown

    // 1. Find the latest trip for this RFID (whether arrival is NULL or not)
    const latestTrip = await prisma.urgentTrips.findFirst({
      where: { rfid },
      orderBy: { departure: "desc" },
    });

    const now = new Date();

    if (latestTrip) {
      // Get the last event time (either departure or arrival)
      const lastEventTime = latestTrip.arrival
        ? latestTrip.arrival
        : latestTrip.departure;
      const secondsSinceLastEvent =
        (now.getTime() - new Date(lastEventTime).getTime()) / 1000;

      if (secondsSinceLastEvent < COOLDOWN_SECONDS) {
        throw new Error(
          `Please wait before tapping again. Cooldown active (${COOLDOWN_SECONDS} seconds).`
        );
      }

      if (latestTrip.arrival === null) {
        // 2. If ongoing trip (arrival is still null), update arrival
        const updatedTrip = await prisma.urgentTrips.update({
          where: { id: latestTrip.id },
          data: { arrival: now },
        });

        return {
          message: "Urgent Trip IN (Arrival) processed successfully",
          data: updatedTrip,
        };
      }
    }

    // 3. No ongoing trip → create a new urgent trip
    const vehicle = await prisma.vehicles.findFirst({
      where: { rfid },
      select: {
        assigned: true,
        plateNo: true,
        type: true,
        vehicleName: true,
      },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found for the given RFID");
    }

    const newUrgentTrip = await prisma.urgentTrips.create({
      data: {
        rfid: rfid,
        driverName: vehicle.assigned,
        plateNo: vehicle.plateNo,
        vehicleName: vehicle.vehicleName,
        departure: now,
        arrival: null,
      },
    });

    return {
      message: "Urgent Trip OUT (Departure) processed successfully",
      data: newUrgentTrip,
    };
  } catch (error) {
    console.error("Error in urgentTap service:", error);
    throw error;
  }
}

module.exports = {
  // urgentTripOut,
  // urgentTripIn,
  getAllUrgents,
  urgentTap,
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
