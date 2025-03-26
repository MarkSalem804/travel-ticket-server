const ticketData = require("../Database/ticket-data");
const sendEmail = require("../Middlewares/sendEmail");

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

    const requestFormData = {
      status: data.status || "Pending",
      requestedBy: data.requestedBy,
      email: data.email,
      officeId: parseInt(data.officeId),
      requestorOffice: officeDetails ? officeDetails.officeName : null,
      designation: data.designation,
      destination: data.destination,
      purpose: data.purpose,
      departureDate: data.departureDate,
      arrivalDate: data.arrivalDate,
      authorizedPassengers: data.authorizedPassengers,
      remarks: data.remarks,
      fileTitle: data.fileTitle || null,
      driverId: parseInt(data.driverId),
      driverName: driverDetails ? driverDetails.driverName : null,
      driverContactNo: driverDetails ? driverDetails.contactNo : null,
      driverEmail: driverDetails ? driverDetails.email : null,
    };

    const submittedRequest = await ticketData.addTicket(requestFormData);

    return submittedRequest;
  } catch (error) {
    console.error("Error submitting ticket!", error);
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

    // Remove undefined fields to prevent Prisma errors
    Object.keys(requestFormData).forEach(
      (key) => requestFormData[key] === undefined && delete requestFormData[key]
    );

    const updatedRequest = await ticketData.updateTicket(
      ticketId,
      requestFormData
    );

    // ✅ Send email if the ticket is "Approved"
    if (updatedData.status === "Approved") {
      const recipientEmails = [updatedData?.email, driverDetails?.email].filter(
        Boolean
      ); // Ensure no null emails
      const subject = "Trip Ticket Approved";
      const emailBody = `
        <h3>Your trip has been approved</h3>
        <p>Kindly bring the following hardcopy of the trip ticket provided below to the authorities for signatures.</p>
        <p><strong>Destination:</strong> ${updatedData.destination}</p>
        <p><strong>Purpose:</strong> ${updatedData.purpose}</p>
        <p><strong>Departure Date:</strong> ${new Date(
          updatedData.departureDate
        ).toLocaleString()}</p>
        <p><strong>Arrival Date:</strong> ${new Date(
          updatedData.arrivalDate
        ).toLocaleString()}</p>
        <p>For any inquiries, please contact support.</p>
      `;

      await sendEmail(recipientEmails.join(","), subject, emailBody);
    }

    return updatedRequest;
  } catch (error) {
    console.error("Error updating ticket!", error);
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
