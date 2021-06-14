import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = `./uploads/${uuidv4()}-${Date.now()}-video`;

    fs.mkdir(dir, (err) => cb(err, dir));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

function fileFilter(req, file, cb) {
  if (
    ["video/mpeg", "video/mp4", "video/webm", "video/x-msvideo"].includes(
      file.mimetype
    )
  ) {
    return cb(null, true);
  }

  cb(null, false);
}

const upload = multer({ storage: storage, fileFilter });

export default upload;
