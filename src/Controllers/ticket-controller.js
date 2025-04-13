const express = require("express");
const upload = require("../Middlewares/upload");
const ticketRouter = express.Router();
const ticketService = require("../Services/ticket-service");
const path = require("path");
const fs = require("fs");

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

    // Set headers for inline display
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
    const data = await ticketService.getAllRequests();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
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
