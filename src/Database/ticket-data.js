const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require("uuid");
const { startOfDay, endOfDay } = require("date-fns");
const { getTodayDateRange } = require("../Utils/dateconf");
const { convertPHToUtcDate } = require("../Utils/convertUtc");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

async function exportReportData(startDate, endDate) {
  try {
    const whereClause = {
      travelStatus: "Completed",
    };

    // Only add date filtering if both dates are provided
    if (startDate && endDate) {
      whereClause.departureDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const data = await prisma.requestform.findMany({
      where: whereClause,
    });

    return data;
  } catch (error) {
    console.error("Failed to retrieve report data:", error);
    throw error;
  }
}

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

async function fetchAllRequests(startDate, endDate) {
  try {
    const whereClause = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Always include the entire end day
      end.setHours(23, 59, 59, 999);

      whereClause.departureDate = {
        gte: start,
        lte: end,
      };
    }

    const fetchedData = await prisma.requestform.findMany({
      where: whereClause,
      orderBy: {
        departureDate: "desc",
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

async function getAllUrgents() {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0); // Start of today (local midnight)

    const end = new Date();
    end.setHours(23, 59, 59, 999); // End of today (local 11:59:59.999 PM)

    // Optional: Log in both local and UTC for debugging
    console.log("start (local):", start);
    console.log("end (local):", end);
    console.log("start (UTC):", start.toISOString());
    console.log("end (UTC):", end.toISOString());

    const data = await prisma.urgentTrips.findMany({
      where: {
        OR: [
          {
            departure: {
              gte: start,
              lte: end,
            },
          },
        ],
      },
      include: {
        vehicles: true,
      },
      orderBy: {
        departure: "desc",
      },
    });

    return data;
  } catch (error) {
    throw error;
  }
}

async function getAllRequestsByDate() {
  try {
    // Get today's date range in local time
    const start = new Date();
    start.setHours(0, 0, 0, 0); // Start of today (local midnight)

    const end = new Date();
    end.setHours(23, 59, 59, 999); // End of today (local 11:59:59.999 PM)

    // Optional: Log in both local and UTC for debugging
    console.log("start (local):", start);
    console.log("end (local):", end);
    console.log("start (UTC):", start.toISOString());
    console.log("end (UTC):", end.toISOString());

    // Query where either departureTime or travelOut is in the range
    const data = await prisma.requestform.findMany({
      where: {
        OR: [
          {
            departureTime: {
              gte: start,
              lt: end,
            },
          },
          {
            travelOut: {
              gte: start,
              lt: end,
            },
          },
        ],
      },
      include: {
        office: true,
        drivers: true,
      },
    });

    const sortedData = data.sort((a, b) => {
      // Determine categories
      const getCategory = (item) => {
        if (item.travelOut && item.travelIn) return 0; // Completed
        if (item.travelOut && !item.travelIn) return 1; // Ongoing
        return 2; // Others
      };

      const aCategory = getCategory(a);
      const bCategory = getCategory(b);

      if (aCategory !== bCategory) return aCategory - bCategory;

      // Within each category, sort descending
      if (aCategory === 0) {
        return new Date(b.travelIn) - new Date(a.travelIn); // Completed by travelIn
      } else if (aCategory === 1) {
        return new Date(b.travelOut) - new Date(a.travelOut); // Ongoing by travelOut
      } else {
        // For "Others", fallback to latest departureTime or travelOut
        const aDate = new Date(a.departureTime ?? a.travelOut ?? 0);
        const bDate = new Date(b.departureTime ?? b.travelOut ?? 0);
        return bDate - aDate;
      }
    });

    console.log("Fetched and sorted data:", sortedData);
    return sortedData;
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
        type: true,
        owner: true,
      },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found for the given RFID");
    }

    // if (vehicle.type === "Government (Red Plate)") {
    //   const err = new Error("Only for Private Vehicles");
    //   err.code = "FORBIDDEN_VEHICLE_TYPE";
    //   throw err;
    // }

    const newUrgentTrip = await prisma.urgentTrips.create({
      data: {
        rfid: rfid,
        driverName: vehicle.assigned,
        ownerName: vehicle.owner,
        plateNo: vehicle.plateNo,
        vehicleName: vehicle.vehicleName,
        type: vehicle.type,
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

async function urgentTapToRequestForm(rfid) {
  try {
    const COOLDOWN_SECONDS = 5;
    const now = new Date();

    // 1. Find the latest request form for this RFID
    const latestRequest = await prisma.requestform.findFirst({
      where: { rfid },
      orderBy: { travelOut: "desc" },
    });

    if (latestRequest) {
      const lastEventTime = latestRequest.travelIn
        ? latestRequest.travelIn
        : latestRequest.travelOut;
      const secondsSinceLastEvent =
        (now.getTime() - new Date(lastEventTime).getTime()) / 1000;

      if (secondsSinceLastEvent < COOLDOWN_SECONDS) {
        throw new Error(
          `Please wait before tapping again. Cooldown active (${COOLDOWN_SECONDS} seconds).`
        );
      }

      if (!latestRequest.travelIn) {
        // Update travelIn (Arrival)
        const updatedRequest = await prisma.requestform.update({
          where: { id: latestRequest.id },
          data: {
            travelIn: now,
            travelStatus: "Completed",
          },
        });

        return {
          message: "Request Form IN (Arrival) processed successfully",
          data: updatedRequest,
        };
      }
    }

    // 2. No ongoing trip → Create a new requestform entry
    const vehicle = await prisma.vehicles.findFirst({
      where: { rfid },
      select: {
        id: true,
        assigned: true,
        plateNo: true,
        type: true,
        vehicleName: true,
        owner: true,
        // contactNo: true,
        // email: true,
        // officeId: true,
      },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found for the given RFID");
    }

    if (vehicle.type === "Employee (Private)") {
      const err = new Error("Only for Governement/Requested Vehicles");
      err.code = "FORBIDDEN_VEHICLE_TYPE";
      throw err;
    }

    const newRequest = await prisma.requestform.create({
      data: {
        rfid: rfid,
        requestedBy: vehicle.owner || "Unknown",
        officeId: vehicle.officeId || 1, // fallback if officeId is null
        requestorOffice: "N/A",
        designation: "N/A",
        destination: "N/A",
        purpose: "Urgent",
        vehicleId: vehicle.id,
        driverName: vehicle.assigned,
        driverContactNo: vehicle.contactNo || "N/A",
        driverEmail: vehicle.email || "N/A",
        plateNumber: vehicle.plateNo,
        vehicleName: vehicle.vehicleName,
        travelOut: now,
        travelIn: null,
        travelStatus: "Ongoing",
        status: "Urgent",
      },
    });

    return {
      message: "Request Form OUT (Departure) processed successfully",
      data: newRequest,
    };
  } catch (error) {
    console.error("Error in urgentTapToRequestForm:", error);
    throw error;
  }
}

async function fetchallUrgentsNoFilter() {
  try {
    const urgents = await prisma.urgentTrips.findMany({
      where: {
        type: "Government (Red Plate)",
      },
      orderBy: {
        arrival: "desc",
      },
    });
    return urgents;
  } catch (error) {
    console.error("Error fetching", error);
    throw error;
  }
}

async function fetchallEmployeesNoFilter() {
  try {
    const urgents = await prisma.urgentTrips.findMany({
      where: {
        type: "Employee (Private)",
      },
      orderBy: {
        arrival: "desc",
      },
    });
    return urgents;
  } catch (error) {
    console.error("Error fetching", error);
    throw error;
  }
}

async function fetchallUrgentTodayTrip() {
  try {
    const urgents = await prisma.requestform.findMany({
      where: {
        status: "Urgent",
      },
      orderBy: {
        travelIn: "desc",
      },
    });
    return urgents;
  } catch (error) {
    console.error("Error fetching", error);
    throw error;
  }
}

async function deleteUrgentTrip(id) {
  try {
    const deletedData = await prisma.urgentTrips.delete({
      where: {
        id: id,
      },
    });
    return deletedData;
  } catch (error) {
    console.error("Error deleting", error);
    throw error;
  }
}

async function deleteTodaysTrip(id) {
  try {
    const deletedData = await prisma.requestform.delete({
      where: {
        id: id,
      },
    });
    return deletedData;
  } catch (error) {
    console.error("Error deleting", error);
    throw error;
  }
}

module.exports = {
  // urgentTripOut,
  // urgentTripIn,
  fetchallUrgentTodayTrip,
  deleteTodaysTrip,
  deleteUrgentTrip,
  fetchallEmployeesNoFilter,
  fetchallUrgentsNoFilter,
  exportReportData,
  getAllUrgents,
  urgentTap,
  urgentTapToRequestForm,
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
