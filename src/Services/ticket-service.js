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

    const adminEmails = await ticketData.getAdminEmails();

    // Email content
    const subject = "New Driver Added";
    const htmlContent = `
          <h3>A new driver has been added:</h3>
          <p><strong>Name:</strong> ${data.driverName}</p>
          <p><strong>Registered Email:</strong> ${data.email}</p>
          <p><strong>Registered Contact No:</strong> ${
            data.contactNo || "N/A"
          }</p>
      `;

    // Send email to all Admins (if any exist)
    if (adminEmails.length > 0) {
      sendEmail(adminEmails, subject, htmlContent);
    }

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
      officeId: data.officeId,
      requestorOffice: officeDetails ? officeDetails.officeName : null,
      designation: data.designation,
      destination: data.destination,
      purpose: data.purpose,
      departureDate: data.departureDate,
      arrrivalDate: data.arrrivalDate,
      authorizedPassengers: data.authorizedPassengers,
      remarks: data.remarks,
      fileTitle: data.fileTitle,
      driverId: data.driverId,
      driverName: driverDetails ? driverDetails.driverName : null,
      driverContactNo: driverDetails ? driverDetails.contactNo : null,
      driverEmail: driverDetails ? driverDetails.email : null,
    };

    const submittedRequest = await ticketData.addRequestForm(requestFormData);

    return submittedRequest;
  } catch (error) {
    console.error("Error submitting ticket!", error);
    throw new Error("Error in Process");
  }
}

module.exports = {
  createOffice,
  createDriver,
  submitTicket,
};
