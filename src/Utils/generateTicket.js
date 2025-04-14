const fs = require("fs");
const { PDFDocument, rgb } = require("pdf-lib");
const path = require("path");
const { DateTime } = require("luxon");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { log } = require("console");

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

// Load the blank trip ticket template
async function generateTripTicket(data) {
  console.log(data);

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

  const formattedDepartureDate = DateTime.fromISO(data.departureDate, {
    setZone: false,
  }).toFormat("yyyy-MM-dd");

  const formattedArrivalDate = DateTime.fromISO(data.arrivalDate, {
    setZone: false,
  }).toFormat("yyyy-MM-dd");

  const {
    formattedTime24Hour: formattedDepartureTime24Hr,
    formattedTime12Hour: formattedDepartureTime12Hr,
  } = formatTimeRaw(data.departureTime);

  const {
    formattedTime24Hour: formattedArrivalTime24Hr,
    formattedTime12Hour: formattedArrivalTime12Hr,
  } = formatTimeRaw(data.arrivalTime);

  const formattedDepartureTime = formattedDepartureTime12Hr;
  const formattedArrivalTime = formattedArrivalTime12Hr;

  const createdAtDate = new Date(data.created_at);
  const formattedCreatedAt =
    DateTime.fromJSDate(createdAtDate).toFormat("yyyy-MM-dd hh:mm a");

  const requestorField = form.getTextField("REQUESTOR");
  requestorField.setText(data.requestedBy);
  requestorField.setFontSize(9);
  requestorField.enableReadOnly();

  const requestorField2 = form.getTextField("REQUESTEDBY");
  requestorField2.setText(data.requestedBy);
  requestorField2.setFontSize(9);
  requestorField2.enableReadOnly();

  const driverField = form.getTextField("DRIVERNAME");
  driverField.setText(data.driverName);
  driverField.setFontSize(9);
  driverField.enableReadOnly();

  const authorizedDriverField = form.getTextField("AUTHORIZEDDRIVER");
  authorizedDriverField.setText(data.driverName);
  authorizedDriverField.setFontSize(9);
  authorizedDriverField.enableReadOnly();

  const vehicleField = form.getTextField("VEHICLENAME");
  vehicleField.setText(data.vehicleName);
  vehicleField.setFontSize(9);
  vehicleField.enableReadOnly();

  const plateField = form.getTextField("PLATENO");
  plateField.setText(data.plateNumber);
  plateField.setFontSize(9);
  plateField.enableReadOnly();

  const createdAtField = form.getTextField("CREATEDAT");
  createdAtField.setText(formattedCreatedAt);
  createdAtField.setFontSize(9);
  createdAtField.enableReadOnly();

  const purposeField = form.getTextField("PURPOSE");
  purposeField.setText(data.purpose);
  purposeField.setFontSize(9);
  purposeField.enableReadOnly();

  const destinationField = form.getTextField("DESTINATION");
  destinationField.setText(data.destination);
  destinationField.setFontSize(9);
  destinationField.enableReadOnly();

  const departureDateField = form.getTextField("DEPARTUREDATE");
  departureDateField.setText(formattedDepartureDate);
  departureDateField.setFontSize(9);
  departureDateField.enableReadOnly();

  const departureTimeField = form.getTextField("DEPARTURETIME");
  departureTimeField.setText(formattedDepartureTime);
  departureTimeField.setFontSize(9);
  departureTimeField.enableReadOnly();

  const arrivalDateField = form.getTextField("ARRIVALDATE");
  arrivalDateField.setText(formattedArrivalDate);
  arrivalDateField.setFontSize(9);
  arrivalDateField.enableReadOnly();

  const arrivalTimeField = form.getTextField("ARRIVALTIME");
  arrivalTimeField.setText(formattedArrivalTime);
  arrivalTimeField.setFontSize(9);
  arrivalTimeField.enableReadOnly();

  const passengersField = form.getTextField("PASSENGERS");
  passengersField.setText(data.authorizedPassengers);
  passengersField.setFontSize(9);
  passengersField.enableReadOnly();

  const passengersField2 = form.getTextField("AUTHORIZEDPASSENGERS");
  passengersField2.setText(data.authorizedPassengers);
  passengersField2.setFontSize(9);
  passengersField2.enableReadOnly();

  form.flatten();

  const outputPath = path.join(
    __dirname,
    "../../generated_tickets",
    `TripTicket_${data.requestedBy}.pdf`
  );

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  return outputPath;
}

module.exports = { generateTripTicket };
