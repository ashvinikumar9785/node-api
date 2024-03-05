// Express.js middleware example
const path = require("path");
const fs = require("fs");
const UPLOAD_DIR = process.env.UPLOAD_DIR;

function imageValidatior(req, res, next) {
  const FileName = req.ImageName;
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/svg+xml",
  ];
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: 400, error: "No File has been Uploaded" });
    }
    if (!allowedTypes.includes(req.file.mimetype)) {
      removeFile(FileName);
      return res
        .status(400)
        .json({ status: 400, error: "Only Images are allowed" });
    }

    // If all checks pass, move to the next middleware
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, error: "Internal server error" });
  }
}

function removeFile(fileName) {
  fs.unlink(path.join(__dirname, `${UPLOAD_DIR}/${fileName}`), function (err) {
    if (err) {
      throw err;
    } else {
      console.log("Successfully deleted the file.");
    }
  });
}

module.exports = {
  imageValidatior,
};
