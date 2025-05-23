const express = require("express");
const upload = require("../Middlewares/upload");
const verifyToken = require("../Utils/jwt");
const ticketRouter = express.Router();
const ticketService = require("../Services/ticket-service");
const path = require("path");
const fs = require("fs");
const { emitEvent } = require("../Middlewares/socketio");

ticketRouter.get("/travelReportData", async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const reportData = await ticketService.exportTravelReport(
      startDate,
      endDate
    );

    if (!reportData || !reportData.buffer || reportData.buffer.length === 0) {
      console.warn(
        "No data found or empty buffer returned for the given date range."
      );
      return res
        .status(404)
        .json({ message: "No data found for the given date range" });
    }

    res.setHeader("Content-Type", reportData.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${reportData.filename}"`
    );

    res.send(reportData.buffer);
  } catch (error) {
    console.error("Export travel report failed:", error);
    res.status(500).json({ message: "Failed to export travel report" });
  }
});

ticketRouter.post("/urgentTap", async (req, res) => {
  try {
    const { rfid } = req.body;

    if (!rfid) {
      return res.status(400).json({ message: "RFID is required" });
    }

    const result = await ticketService.urgentTrip(rfid);

    res.status(200).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("Error in urgentTap route:", error);

    // if (error.code === "FORBIDDEN_VEHICLE_TYPE") {
    //   return res.status(403).json({
    //     message: error.message,
    //     code: error.code,
    //   });
    // }

    res.status(500).json({
      message: "Error processing urgent trip tap",
      error: error.message,
    });
  }
});

ticketRouter.post("/urgentTapToForm", async (req, res) => {
  const { rfid } = req.body;
  console.log("[INFO] Incoming /urgentTapToForm request - RFID:", rfid);

  try {
    if (!rfid) {
      console.warn("[WARN] Missing RFID in request body");
      return res.status(400).json({ message: "RFID is required" });
    }

    console.log("[INFO] Processing urgent trip form for RFID:", rfid);
    const result = await ticketService.urgentTripForm(rfid);

    console.log("[SUCCESS] Urgent trip form processed for RFID:", rfid);
    res.status(200).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("[ERROR] Error in urgentTapForm route:", error);

    if (error.code === "FORBIDDEN_VEHICLE_TYPE") {
      console.warn("[FORBIDDEN] Vehicle type not allowed for RFID:", rfid);
      return res.status(403).json({
        message: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      message: "Error processing urgent trip tap",
      error: error.message,
    });
  }
});

ticketRouter.get("/viewAttachment/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    const ticket = await ticketService.viewAttachmentById(requestId);
    if (!ticket || !ticket.fileTitle) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    const filePath = path.join(
      __dirname,
      "../../attachments",
      ticket.fileTitle
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File does not exist" });
    }

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${ticket.fileTitle}"`
    );
    res.setHeader("Content-Type", getMimeType(ticket.fileTitle));

    res.sendFile(filePath);
  } catch (error) {
    console.error("❌ Error viewing attachment", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.post("/addOffice", async (req, res) => {
  try {
    const data = req.body;

    const office = await ticketService.createOffice(data);

    res.status(201).json(office);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.post("/addDriver", async (req, res) => {
  try {
    const data = req.body;

    const driver = await ticketService.createDriver(data);

    res.status(201).json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.post("/addVehicle", async (req, res) => {
  try {
    const data = req.body;

    const vehicle = await ticketService.createVehicle(data);

    res.status(201).json(vehicle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.put("/updateDriver/:driverId", async (req, res) => {
  try {
    const driverId = parseInt(req.params.driverId);

    const updatedData = req.body;

    const driver = await ticketService.updateDriver(driverId, updatedData);

    res.status(201).json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.put("/updateVehicle/:vehicleId", async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);

    const updatedData = req.body;

    const vehicle = await ticketService.updateVehicle(vehicleId, updatedData);

    res.status(201).json(vehicle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.post("/submitTicket", upload.single("file"), async (req, res) => {
  try {
    const fileName = req.file ? req.file.filename : null;
    const requestData = { ...req.body, fileTitle: fileName };

    const ticket = await ticketService.submitTicket(requestData);

    res.status(201).json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.put("/updateRequest/:ticketId", async (req, res) => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    const updatedData = req.body;

    if (!ticketId) {
      return res.status(400).json({ error: "Ticket ID is required" });
    }

    const newTicket = await ticketService.updateRequest(ticketId, updatedData);

    emitEvent("ticket-updated", { id: ticketId, type: "out", newTicket });

    res.status(201).json(newTicket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.get("/getAllOffices", async (req, res) => {
  try {
    const fetchedOffices = await ticketService.getAllOffices();
    res.status(200).json(fetchedOffices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.get("/getAllUrgentTrips", async (req, res) => {
  try {
    const fetchedTrips = await ticketService.getAllUrgentTrips();
    res.status(200).json(fetchedTrips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.get("/getAllVehicles", async (req, res) => {
  try {
    const fetchedVehicles = await ticketService.getAllVehicles();
    res.status(200).json(fetchedVehicles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.get("/getAllDrivers", async (req, res) => {
  try {
    const fetchedDrivers = await ticketService.getAllDrivers();
    res.status(200).json(fetchedDrivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.get("/getAllRequests", async (req, res) => {
  try {
    let { startDate, endDate } = req.query;

    // Optional: decode in case client didn't encode the URL properly
    startDate = decodeURIComponent(startDate || "");
    endDate = decodeURIComponent(endDate || "");

    const data = await ticketService.getAllRequests(startDate, endDate);
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.get("/getAllUrgentsNoFilters", async (req, res) => {
  try {
    const data = await ticketService.getAllUrgentstsNoFilters();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.get("/getAllEmployeesNoFilters", async (req, res) => {
  try {
    const data = await ticketService.getAllEmployeesNoFilters();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.get("/getAllUrgentTodayTrip", async (req, res) => {
  try {
    const data = await ticketService.getAllUrgentTrip();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.get("/getAllRequestsForToday", async (req, res) => {
  try {
    const data = await ticketService.getRequestsForToday();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.post("/getRequestByRFIDAndId", async (req, res) => {
  try {
    const { rfid, requestId } = req.body;

    const data = await ticketService.getRequestByRFIDAndId(rfid, requestId);
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.post("/getAllRequestsByRFID", async (req, res) => {
  try {
    const { rfid } = req.body;

    const data = await ticketService.getRequestsByRFID(rfid.trim());
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.post("/travelOut", async (req, res) => {
  try {
    const { rfid, id: requestId } = req.body;

    const request = await ticketService.getRequestByRFIDAndId(rfid, requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    if (request.travelOut) {
      return res
        .status(200)
        .json({ message: "Travel has already started for this trip." });
    }

    const updatedRequest = await ticketService.travelOutTime(rfid, requestId);

    emitEvent("travel-updated", { id: requestId, type: "out", updatedRequest });

    res.status(200).json({
      message: "Travel out recorded successfully.",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error in /travelOut:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.post("/travelIn", async (req, res) => {
  try {
    const { rfid, id: requestId } = req.body;
    console.log(
      `Received travelIn request with rfid: ${rfid}, requestId: ${requestId}`
    );

    const request = await ticketService.getRequestByRFIDAndId(rfid, requestId);
    console.log("Request found:", request);

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    if (!request.travelOut) {
      return res.status(200).json({
        message: "Travel has not started yet. Please scan out first.",
      });
    }

    if (request.travelIn) {
      return res
        .status(200)
        .json({ message: "Travel has already been completed." });
    }

    const updatedRequest = await ticketService.travelInTime(rfid, requestId);
    console.log("Updated request after travelIn:", updatedRequest);

    emitEvent("travel-updated", { id: requestId, type: "in", updatedRequest });

    res.status(200).json({
      message: "Travel in recorded successfully.",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error in /travelIn:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.delete("/deleteVehicle/:vehicleId", async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);

    const deletedData = await ticketService.deleteVehicle(vehicleId);
    res.status(200).json(deletedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.delete("/deleteDriver/:driverId", async (req, res) => {
  try {
    const driverId = parseInt(req.params.driverId);

    const deletedData = await ticketService.deleteDriver(driverId);
    res.status(200).json(deletedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.delete("/deleteUrgentTrip/:id", async (req, res) => {
  try {
    const urgentId = parseInt(req.params.id);

    const deletedData = await ticketService.deleteUrgents(urgentId);
    res.status(200).json(deletedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

ticketRouter.delete("/deleteTodayTrip/:id", async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);

    const deletedData = await ticketService.deleteTodayTrip(tripId);
    res.status(200).json(deletedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Helper to get MIME type
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".xls":
      return "application/vnd.ms-excel";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    default:
      return "application/octet-stream";
  }
}

module.exports = ticketRouter;
