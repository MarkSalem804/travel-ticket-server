const { v4: uuidv4 } = require("uuid");
const { DateTime } = require("luxon");
const bwipjs = require("bwip-js");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const QRCode = require("qrcode");
const ticketData = require("../Database/ticket-data");
const generateTripTicket = require("../Utils/generateTicket");
const sendEmail = require("../Middlewares/sendEmail");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

function formatTimeRaw(timeString) {
  if (!timeString)
    return { formattedTime24Hour: null, formattedTime12Hour: null };

  const timePart = timeString.split("T")[1]?.slice(0, 5); // "13:00"

  // Convert to 12-hour format
  let [hours, minutes] = timePart.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert 0 to 12

  const formattedTime12Hour = `${hours}:${minutes
    .toString()
    .padStart(2, "0")} ${ampm}`;
  const formattedTime24Hour = timePart;

  return {
    formattedTime24Hour,
    formattedTime12Hour,
  };
}

async function generateBarcodeWithDetails(uniqueUID, details, barcodePath) {
  return new Promise(async (resolve, reject) => {
    try {
      // Format the dates and times exactly as they are without timezone conversion
      const formattedDepartureDate = DateTime.fromISO(details.departureDate, {
        setZone: false,
      }).toFormat("yyyy-MM-dd");
      const formattedArrivalDate = DateTime.fromISO(details.arrivalDate, {
        setZone: false,
      }).toFormat("yyyy-MM-dd");

      console.log(details.arrivalTime);
      console.log(details.departureTime);

      // Format times
      const {
        formattedTime24Hour: formattedDepartureTime24Hr,
        formattedTime12Hour: formattedDepartureTime12Hr,
      } = formatTimeRaw(details.departureTime);
      const {
        formattedTime24Hour: formattedArrivalTime24Hr,
        formattedTime12Hour: formattedArrivalTime12Hr,
      } = formatTimeRaw(details.arrivalTime);

      // Choose the format you want (either 24-hour or 12-hour)
      const formattedDepartureTime = formattedDepartureTime12Hr; // or use formattedDepartureTime24Hr if you prefer 24-hour format
      const formattedArrivalTime = formattedArrivalTime12Hr; // or use formattedArrivalTime24Hr if you prefer 24-hour format

      // Generate Barcode
      const barcodeBuffer = await new Promise((resolve, reject) => {
        bwipjs.toBuffer(
          {
            bcid: "code128", // Barcode type
            text: uniqueUID, // Unique ID as barcode content
            scale: 3,
            height: 10,
            includetext: false,
            textxalign: "center",
          },
          (err, png) => {
            if (err) return reject(err);
            resolve(png);
          }
        );
      });

      // Create Canvas
      const canvas = createCanvas(400, 340); // Adjust size for text + barcode
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Text Details
      ctx.fillStyle = "#000000";
      ctx.font = "16px Arial";
      ctx.fillText(`Requested By: ${details.requestedBy}`, 20, 30);
      ctx.fillText(`Driver: ${details.driverName}`, 20, 55);
      ctx.fillText(`Destination: ${details.destination}`, 20, 80);
      ctx.fillText(`Purpose: ${details.purpose}`, 20, 105);
      ctx.fillText(`Departure Date: ${formattedDepartureDate}`, 20, 130);
      ctx.fillText(`Arrival Date: ${formattedArrivalDate}`, 20, 155);
      ctx.fillText(`Departure Time: ${formattedDepartureTime}`, 20, 180);
      ctx.fillText(`Arrival Time: ${formattedArrivalTime}`, 20, 205);

      // Load Barcode
      const barcodeImg = await loadImage(barcodeBuffer);
      ctx.drawImage(barcodeImg, 50, 220, 300, 80);

      // Save Image
      const out = fs.createWriteStream(barcodePath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);
      out.on("finish", resolve);
    } catch (error) {
      reject(error);
    }
  });
}

async function createOffice(data) {
  try {
    const office = await ticketData.addOffice(data);
    return office;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function createDriver(data) {
  try {
    const driver = await ticketData.addDriver(data);

    return driver;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function submitTicket(data) {
  try {
    let driverDetails = null;
    let officeDetails = null;

    if (data.driverId) {
      driverDetails = await ticketData.getDriverByDriverId(data.driverId);
    }

    if (data.officeId) {
      officeDetails = await ticketData.getOfficeById(data.officeId);
    }

    const convertToUTC = (dateString) => {
      if (!dateString) return null;
      const localDate = new Date(dateString);
      return new Date(
        localDate.getTime() - localDate.getTimezoneOffset() * 60000
      );
    };

    const requestFormData = {
      status: data.status || "Pending",
      requestedBy: data.requestedBy,
      email: data.email,
      officeId: parseInt(data.officeId),
      requestorOffice: officeDetails ? officeDetails.officeName : null,
      designation: data.designation,
      destination: data.destination,
      purpose: data.purpose,
      departureDate: convertToUTC(data.departureDate),
      arrivalDate: convertToUTC(data.arrivalDate),
      departureTime: convertToUTC(data.departureTime),
      arrivalTime: convertToUTC(data.arrivalTime),
      created_at: data.created_at ? convertToUTC(data.created_at) : undefined,
      authorizedPassengers: data.authorizedPassengers,
      remarks: data.remarks,
      fileTitle: data.fileTitle || null,
      driverId: parseInt(data.driverId) || null,
      driverName: driverDetails ? driverDetails.driverName : null,
      driverContactNo: driverDetails ? driverDetails.contactNo : null,
      driverEmail: driverDetails ? driverDetails.email : null,
    };

    const submittedRequest = await ticketData.addTicket(requestFormData);
    return submittedRequest;
  } catch (error) {
    console.error("❌ Error submitting ticket!", error);
    throw new Error("Error in Process");
  }
}

async function updateRequest(ticketId, updatedData) {
  try {
    let driverDetails = null;
    let officeDetails = null;
    let vehicleDetails = null;

    // Fetch driver details
    if (updatedData.driverId) {
      driverDetails = await ticketData.getDriverByDriverId(
        updatedData.driverId
      );
    }

    if (updatedData.vehicleId) {
      vehicleDetails = await ticketData.getVehicleByVehicleId(
        updatedData.vehicleId
      );
    }

    // Fetch office details
    if (updatedData.officeId) {
      officeDetails = await ticketData.getOfficeById(updatedData.officeId);
    }

    const requestFormData = {
      status: updatedData.status || "Pending",
      requestedBy: updatedData.requestedBy,
      email: updatedData.email,
      officeId: updatedData.officeId,
      requestorOffice: officeDetails ? officeDetails.officeName : null,
      designation: updatedData.designation,
      destination: updatedData.destination,
      purpose: updatedData.purpose,
      departureDate: updatedData.departureDate,
      arrivalDate: updatedData.arrivalDate,
      departureTime: updatedData.departureTime,
      arrivalTime: updatedData.arrivalTime,
      authorizedPassengers: updatedData.authorizedPassengers,
      remarks: updatedData.remarks,
      fileTitle: updatedData.fileTitle,
      vehicleId: updatedData.vehicleId,
      vehicleName: vehicleDetails ? vehicleDetails.vehicleName : null,
      plateNumber: vehicleDetails ? vehicleDetails.plateNo : null,
      rfid: vehicleDetails ? vehicleDetails.rfid : null,
      driverId: updatedData.driverId,
      driverName: driverDetails ? driverDetails.driverName : null,
      driverContactNo: driverDetails ? driverDetails.contactNo : null,
      driverEmail: driverDetails ? driverDetails.email : null,
    };

    // Update request form first
    const updatedRequest = await ticketData.updateTicket(
      ticketId,
      requestFormData
    );

    if (!updatedRequest) {
      throw new Error(`Failed to update request form with ID: ${ticketId}`);
    }

    if (updatedData.status === "Approved") {
      // ✅ Generate Unique UID for Barcode
      const uniqueUID = uuidv4();

      // ✅ Insert UID into `tickets` table
      await ticketData.updateTicketUID(ticketId, uniqueUID, "Approved");

      // ✅ Generate Barcode Image
      const barcodePath = `${__dirname}/../../Barcodes/${uniqueUID}.png`;
      await generateBarcodeWithDetails(
        uniqueUID,
        {
          requestedBy: updatedData.requestedBy,
          driverName: driverDetails?.driverName || "N/A",
          vehicleName: vehicleDetails?.vehicleName || "N/A",
          plateNumber: vehicleDetails?.plateNo,
          destination: updatedData.destination,
          purpose: updatedData.purpose,
          departureDate: updatedData.departureDate,
          arrivalDate: updatedData.departureDate,
          departureTime: updatedData.departureTime,
          arrivalTime: updatedData.arrivalTime,
        },
        barcodePath
      );

      // ✅ Generate Trip Ticket PDF
      const travelSummary = {
        requestedBy: updatedData.requestedBy,
        driverName: driverDetails?.driverName,
        destination: updatedData.destination,
        purpose: updatedData.purpose,
        departureDate: updatedData.departureDate,
        arrivalDate: updatedData.arrivalDate,
        departureTime: updatedData.departureTime,
        arrivalTime: updatedData.arrivalTime,
        barcodePath,
      };
      const ticketPath = await generateTripTicket.generateTripTicket(
        travelSummary
      );

      // ✅ Send Email with PDF and Barcode Attachment
      const recipientEmails = [updatedData?.email, driverDetails?.email].filter(
        Boolean
      );
      const subject = "Trip Ticket Approved";
      const emailBody = `
        <h3>Your trip has been approved</h3>
        <p>Kindly bring the following hardcopy of the trip ticket provided below to the authorities for signatures.</p>
        <p>For any inquiries, please contact support.</p>
      `;

      try {
        await sendEmail(recipientEmails.join(","), subject, emailBody, [
          ticketPath,
          barcodePath,
        ]);
      } catch (emailError) {
        console.error("❌ Error sending Trip Ticket PDF email:", emailError);
      }
    } else if (updatedData.status === "Rejected") {
      const recipientEmails = [updatedData?.email].filter(Boolean);
      const subject = "Trip Ticket Rejected";
      const emailBody = `
        <h3>Your trip request has been rejected</h3>
        <p>Unfortunately, your trip ticket request was not approved.</p>
        <p>For further details, please contact support or your office administrator.</p>
      `;

      try {
        await sendEmail(recipientEmails.join(","), subject, emailBody);
      } catch (emailError) {
        console.error("❌ Error sending rejection email:", emailError);
      }
    }

    return updatedRequest;
  } catch (error) {
    console.error("❌ Error updating ticket:", error);
    throw new Error("Error in Process");
  }
}

async function getAllOffices() {
  try {
    const fetchedOffices = await ticketData.getAllOffices();
    return fetchedOffices;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function getAllRequests() {
  try {
    const requests = await ticketData.fetchAllRequests();
    return requests;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function getAllVehicles() {
  try {
    const requests = await ticketData.fetchAllVehicles();
    return requests;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

async function getAllDrivers() {
  try {
    const drivers = await ticketData.fetchAllDrivers();
    return drivers;
  } catch (error) {
    console.error("Error!", error);
    throw new Error("Error in Process");
  }
}

module.exports = {
  createOffice,
  createDriver,
  submitTicket,
  updateRequest,
  getAllOffices,
  getAllRequests,
  getAllVehicles,
  getAllDrivers,
};
