const fs = require("fs");
const { PDFDocument, rgb } = require("pdf-lib");
const path = require("path");

// Load the blank trip ticket template
async function generateTripTicket(data) {
  console.log("🔍 Incoming Data for Trip Ticket:", data);

  // Read the uploaded template
  const templatePath = path.join(
    __dirname,
    "../../templates",
    "TRIP-TICKET SoftCopy.pdf"
  );
  const templateBytes = fs.readFileSync(templatePath);

  // Load the existing PDF
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  // Set text fields with smaller font
  const requestorField = form.getTextField("REQUESTOR");
  requestorField.setText(data.requestedBy);
  requestorField.setFontSize(9);
  requestorField.enableReadOnly(); // Make the field read-only

  const purposeField = form.getTextField("PURPOSE");
  purposeField.setText(data.purpose);
  purposeField.setFontSize(9);
  purposeField.enableReadOnly();

  const destinationField = form.getTextField("DESTINATION");
  destinationField.setText(data.destination);
  destinationField.setFontSize(9);
  destinationField.enableReadOnly();

  const passengersField = form.getTextField("PASSENGERS");
  passengersField.setText(data.authorizedPassenger);
  passengersField.setFontSize(9);
  passengersField.enableReadOnly();

  // Flatten the form to remove interactive fields
  form.flatten();

  // Save the new PDF
  const outputPath = path.join(
    __dirname,
    "../../generated_tickets",
    `TripTicket_${data.requestedBy}.pdf`
  );
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  console.log(`✅ Trip Ticket generated: ${outputPath}`);
  return outputPath;
}

module.exports = { generateTripTicket };
