import { cloudinary } from "./config";
import { IImage } from "../models/image";
import { Readable } from "stream";

export async function uploadToCloudinary(
  folder: string,
  file: File,
): Promise<IImage | null> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);
    const uploadPromise = new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          upload_preset: "immifit",
          folder: folder,
          public_id: file.name.split(".")[0],
          resource_type: "auto",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      stream.pipe(uploadStream);
    });

    const uploadResponse = await uploadPromise;

    return {
      id: uploadResponse.public_id,
      url: uploadResponse.secure_url,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      return true;
    } else {
      console.error("Cloudinary delete returned:", result);
      return false;
    }
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
}

export async function replaceCloudinaryImage(
  folder: string,
  oldPublicId: string | undefined,
  file: File,
): Promise<IImage | null> {
  try {
    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }

    return await uploadToCloudinary(folder, file);
  } catch (error) {
    console.error("Image replacement error:", error);
    return null;
  }
}
