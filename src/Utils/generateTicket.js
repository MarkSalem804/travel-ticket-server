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

function truncateWithEllipsis(text, maxLength) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength - 3) + "..." : text;
}

function setTextIfFieldExists(form, fieldName, value, fontSize = 9) {
  let field;
  try {
    field = form.getTextField(fieldName);
    if (field) {
      field.setText(value);
      field.setFontSize(fontSize);
      field.enableReadOnly();
    }
  } catch (e) {
    // Field does not exist, ignore
  }
}

// Load the blank trip ticket template
async function generateTripTicket(data) {
  console.log(data);

  // Read the uploaded template
  const templatePath = path.join(
    __dirname,
    "../../templates",
    "SCHOOLS DIVISION OF IMUS CITY - REVISED FORM 2025_.pdf"
  );

  const templatePath2 = path.join(
    __dirname,
    "../../templates",
    "SDOIC - ASDS - Trip approval.pdf"
  );

  const templatePath3 = path.join(
    __dirname,
    "../../templates",
    "Trip Ticket Request New.pdf"
  );

  const specialEmails = [
    "maricel.aureo@deped.gov.ph",
    "ronnie.yohan@deped.gov.ph",
    "samiesan.bagbagay@deped.gov.ph",
  ];

  // Override values for samiesan.bagbagay@deped.gov.ph
  if (data.email === "samiesan.bagbagay@deped.gov.ph") {
    data.driverName = "Wilfredo P. Estopace";
    data.vehicleName = "TOYOTA HI ACE";
    data.plateNumber = "P3G 118";
  }

  let selectedTemplatePath;
  if (data.email === "samiesan.bagbagay@deped.gov.ph") {
    selectedTemplatePath = templatePath3;
  } else if (specialEmails.includes(data.email)) {
    selectedTemplatePath = templatePath2;
  } else {
    selectedTemplatePath = templatePath;
  }

  const templateBytes = fs.readFileSync(selectedTemplatePath);

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

  setTextIfFieldExists(form, "REQUESTOR", data.requestedBy);
  setTextIfFieldExists(form, "TRACKINGNUMBER", data.trackingId);
  setTextIfFieldExists(form, "REQUESTEDBY", data.requestedBy);
  setTextIfFieldExists(form, "DRIVERNAME", data.driverName);
  setTextIfFieldExists(form, "AUTHORIZEDDRIVER", data.driverName);
  setTextIfFieldExists(form, "VEHICLENAME", data.vehicleName);
  setTextIfFieldExists(form, "PLATENO", data.plateNumber);
  setTextIfFieldExists(form, "CREATEDAT", formattedCreatedAt);
  setTextIfFieldExists(
    form,
    "PURPOSE",
    truncateWithEllipsis(data.purpose, 125)
  );
  setTextIfFieldExists(
    form,
    "DESTINATION",
    truncateWithEllipsis(data.destination, 50)
  );
  setTextIfFieldExists(form, "DEPARTUREDATE", formattedDepartureDate);
  setTextIfFieldExists(form, "DEPARTURETIME", formattedDepartureTime);
  setTextIfFieldExists(form, "ARRIVALDATE", formattedArrivalDate);
  setTextIfFieldExists(form, "ARRIVALTIME", formattedArrivalTime);
  setTextIfFieldExists(
    form,
    "PASSENGERS",
    truncateWithEllipsis(data.authorizedPassengers, 125)
  );
  setTextIfFieldExists(
    form,
    "AUTHORIZEDPASSENGERS",
    truncateWithEllipsis(data.authorizedPassengers, 125)
  );

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
