import { cloudinary } from "../config/cloudinary.js";
import AppError from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";

// Upload a file (certification, profile image, etc.)
export const uploadFile = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No file uploaded", 400));
  }
  // Only allow images and PDFs
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "image/webp",
    "image/jpg",
  ];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return next(new AppError("Only images and PDFs are allowed", 400));
  }
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: req.body.folder || "uploads",
    resource_type: req.file.mimetype === "application/pdf" ? "raw" : "image",
  });
  res.status(201).json({
    success: true,
    message: "File uploaded successfully",
    url: result.secure_url,
    public_id: result.public_id,
    resource_type: result.resource_type,
    original_filename: result.original_filename,
    format: result.format,
  });
});

// Download a file by URL (Cloudinary serves files via URL, so just redirect)
export const downloadFile = catchAsync(async (req, res, next) => {
  const { url } = req.query;
  if (!url) {
    return next(new AppError("No file URL provided", 400));
  }
  // Optionally, validate the URL is from your Cloudinary account
  res.redirect(url);
});

export default {
  uploadFile,
  downloadFile,
};
