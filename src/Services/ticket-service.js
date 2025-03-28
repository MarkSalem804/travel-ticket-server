const ticketData = require("../Database/ticket-data");
const generateTripTicket = require("../Utils/generateTicket");
const sendEmail = require("../Middlewares/sendEmail");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

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

    console.log("departureDate type:", typeof data.departureDate);
    console.log("departureDate value:", data.departureDate);
    console.log("departureTime type:", typeof data.departureTime);
    console.log("departureTime value:", data.departureTime);

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

    if (updatedData.driverId) {
      driverDetails = await ticketData.getDriverByDriverId(
        updatedData.driverId
      );
    }

    if (updatedData.officeId) {
      officeDetails = await ticketData.getOfficeById(updatedData.officeId);
    }

    console.log(officeDetails);
    console.log(driverDetails);
    console.log("🛠️ updatedData:", updatedData);

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
      authorizedPassengers: updatedData.authorizedPassengers,
      remarks: updatedData.remarks,
      fileTitle: updatedData.fileTitle,
      driverId: updatedData.driverId,
      driverName: driverDetails ? driverDetails.driverName : null,
      driverContactNo: driverDetails ? driverDetails.contactNo : null,
      driverEmail: driverDetails ? driverDetails.email : null,
    };

    const updatedRequest = await ticketData.updateTicket(
      ticketId,
      requestFormData
    );

    //Send email with PDF if the ticket is "Approved"
    if (updatedData.status === "Approved") {
      const recipientEmails = [updatedData?.email, driverDetails?.email].filter(
        Boolean
      ); // Ensure no null emails
      const subject = "Trip Ticket Approved";
      const emailBody = `
        <h3>Your trip has been approved</h3>
        <p>Kindly bring the following hardcopy of the trip ticket provided below to the authorities for signatures.</p>
        <p>For any inquiries, please contact support.</p>
      `;

      try {
        // ✅ Generate Trip Ticket PDF
        const ticketPath = await generateTripTicket.generateTripTicket(
          requestFormData
        );

        // ✅ Send Email with PDF Attachment
        await sendEmail(
          recipientEmails.join(","),
          subject,
          emailBody,
          ticketPath
        );
      } catch (pdfError) {
        console.error(
          "❌ Error generating or sending Trip Ticket PDF:",
          pdfError
        );
      }
    } else if (updatedData.status === "Rejected") {
      const recipientEmails = [updatedData?.email].filter(Boolean); // Only send to the requester
      const subject = "Trip Ticket Rejected";
      const emailBody = `
        <h3>Your trip request has been rejected</h3>
        <p>Unfortunately, your trip ticket request was not approved.</p>
        <p>For further details, please contact support or your office administrator.</p>
      `;

      try {
        // ✅ Send rejection email
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

module.exports = {
  createOffice,
  createDriver,
  submitTicket,
  updateRequest,
  getAllOffices,
};
