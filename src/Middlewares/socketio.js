const { Server } = require("socket.io");
const { version, patchNotes } = require("../../versioncontrols/version");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "https://tripticket.depedimuscity.com", // or specify your frontend URL if needed
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.emit("version-info", { version, patchNotes });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

// Function to emit events easily
const emitEvent = (eventName, data) => {
  if (io) {
    io.emit(eventName, data);
  }
};

module.exports = { initSocket, emitEvent };
