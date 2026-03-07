import ImageKit from "imagekit-javascript";
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from 'uuid';

export const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
export const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;

export const imagekit = new ImageKit({
    publicKey: publicKey,
    urlEndpoint: urlEndpoint,
});

/**
 * Client-side authenticator using the private key.
 * NOTE: For security, authentication should ideally be handled by a secure backend server.
 */
export const authenticator = async () => {
    try {
        const token = uuidv4();
        const expire = Math.floor(Date.now() / 1000) + 3600;
        const privateKey = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY;

        if (!privateKey) throw new Error("VITE_IMAGEKIT_PRIVATE_KEY is missing in env");

        // ImageKit expects HMAC-SHA1(token + expire, privateKey)
        const msg = token + expire.toString();
        const signature = CryptoJS.HmacSHA1(msg, privateKey).toString(CryptoJS.enc.Hex);

        console.log("ImageKit Auth Debug:", {
            token,
            expire,
            msg,
            signature_start: signature.substring(0, 8)
        });

        return {
            signature,
            token,
            expire,
        };
    } catch (err: any) {
        console.error("Auth gen error:", err);
        throw new Error(`Authentication generation failed: ${err.message}`);
    }
};

/**
 * Utility to upload a file to ImageKit
 */
export const uploadFile = async (file: File | string, fileName: string, folder: string = "") => {
    const auth = await authenticator();

    // Minimal folder sanitization
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');

    return new Promise((resolve, reject) => {
        const uploadOptions: any = {
            file: file,
            fileName: fileName,
            useUniqueFileName: true,
            ...auth
        };

        if (cleanFolder) {
            uploadOptions.folder = cleanFolder;
        }

        console.log("Starting ImageKit Upload for:", fileName);

        imagekit.upload(uploadOptions, (err: any, result: any) => {
            if (err) {
                // Check if the error is "Internal Server Error"
                console.error("ImageKit Upload Error Object:", err);

                let errorMessage = "Upload failed";
                if (typeof err === 'string') errorMessage = err;
                else if (err && (err as any).message) errorMessage = (err as any).message;

                // IMPORTANT: If 500 error persists, it usually means "Client-side file upload" is DISABLED 
                // in ImageKit Dashboard -> Settings -> Safety.
                reject(new Error(errorMessage));
            }
            else {
                console.log("ImageKit Upload Success:", result.url);
                resolve(result);
            }
        });
    });
};
