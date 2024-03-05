const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/api/static/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
    req.ImageName = file.originalname;
  },
});
const upload = multer({ storage: storage });

module.exports = { upload };
