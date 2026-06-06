const cloudinary = require("../utils/cloudinary");

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided. Please upload an image file.",
      });
    }

    const buffer = req.file.buffer;

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "restaurant_images" },
        (error, uploadedImage) => {
          if (error) return reject(error);
          resolve(uploadedImage);
        },
      );

      uploadStream.end(buffer);
    });

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
