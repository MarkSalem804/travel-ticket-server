const multer = require("multer");
const path = require("path");

// Set storage location
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../attachments")); // Ensure "tickets" folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.originalname);
  },
});

// File filter (optional, restrict file types)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, and PDF are allowed."));
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;
