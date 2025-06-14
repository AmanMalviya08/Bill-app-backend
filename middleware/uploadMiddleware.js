// middlewares/uploadMiddleware.js

const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage(); // Store file in memory for processing

const fileFilter = (req, file, cb) => {
  const filetypes = /xlsx|xls|csv/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: Only Excel files are allowed!');
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;