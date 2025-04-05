const express = require("express");
const upload = require("../Middlewares/upload");
const ticketRouter = express.Router();
const ticketService = require("../Services/ticket-service");

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

    console.log("🛠️ Incoming Request Body:", req.body);
    console.log("🔍 Headers:", req.headers);
    console.log("📦 Raw Body:", req.body);

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

ticketRouter.get("/getAllRequests", async (req, res) => {
  try {
    const data = await ticketService.getAllRequests();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = ticketRouter;
