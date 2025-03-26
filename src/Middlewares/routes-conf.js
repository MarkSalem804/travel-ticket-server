const express = require("express");
const ticketRouter = require("../Controllers/ticket-controller");

const Routes = (app, prisma) => {
  const router = express.Router();

  router.use("/ticket", ticketRouter);

  app.use("/", router);

  router.use((req, res) => {
    res.status(404).send("Route not found");
  });

  router.use((req, res) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong! ");
  });
};

module.exports = Routes;
