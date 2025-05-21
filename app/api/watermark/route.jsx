
// import { NextResponse } from "next/server";
// import sharp from "sharp";
// import { v4 as uuidv4 } from "uuid";
// import path from "path";
// import { promises as fs } from "fs";

// const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
// const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif"]);

// async function ensureUploadDir() {
//     await fs.mkdir(UPLOAD_DIR, { recursive: true });
// }

// function allowedFile(filename) {
//     const ext = filename.split(".").pop()?.toLowerCase();
//     return ext && ALLOWED_EXTENSIONS.has(ext);
// }

// export async function POST(request) {
//     try {
//         await ensureUploadDir();

//         const formData = await request.formData();
//         const imageFile = formData.get("image");
//         const logoFile = formData.get("logo");
//         const watermarkType = formData.get("watermark_type");
//         const watermarkText = formData.get("watermark_text");
//         const watermarkX = parseInt(formData.get("watermark_x")) || 0;
//         const watermarkY = parseInt(formData.get("watermark_y")) || 0;
//         const watermarkOpacity = parseFloat(formData.get("watermark_opacity")) || 0.5;
//         const watermarkSize = parseInt(formData.get("watermark_size")) || 30;
//         const watermarkColor = formData.get("watermark_color");
//         const rotationAngle = parseInt(formData.get("rotation_angle")) || 0;

//         console.log("API Received Coordinates:", { watermarkX, watermarkY, watermarkSize, watermarkType });

//         if (!imageFile || !allowedFile(imageFile.name)) {
//             return NextResponse.json({ error: "Invalid or missing image file" }, { status: 400 });
//         }

//         if (watermarkType === "logo" && (!logoFile || !allowedFile(logoFile.name))) {
//             return NextResponse.json({ error: "Invalid or missing logo file" }, { status: 400 });
//         }

//         const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
//         let sharpImage = sharp(imageBuffer).ensureAlpha();
//         const metadata = await sharpImage.metadata();
//         if (!metadata.width || !metadata.height) {
//             return NextResponse.json({ error: "Invalid image metadata" }, { status: 400 });
//         }

//         const maxHeight = 600;
//         sharpImage = sharpImage.resize({
//             height: maxHeight,
//             fit: "contain",
//             background: { r: 0, g: 0, b: 0, alpha: 0 },
//             withoutEnlargement: true,
//         });
//         const resizedMetadata = await sharpImage.metadata();
//         metadata.width = resizedMetadata.width;
//         metadata.height = resizedMetadata.height;

//         console.log("Base Image Metadata:", { width: metadata.width, height: metadata.height });

//         let overlayBuffer;
//         let compositeTop = watermarkY;
//         let compositeLeft = watermarkX;

//         if (watermarkType === "text") {
//             if (!watermarkText) {
//                 return NextResponse.json({ error: "No text provided for text watermark" }, { status: 400 });
//             }

//             const fontSize = Math.max(10, Math.min(watermarkSize, Math.floor(metadata.width * 0.1)));
//             const textWidth = Math.min(watermarkText.length * fontSize * 0.6, metadata.width * 0.8);
//             const textHeight = fontSize * 1.2;
//             const svgWidth = Math.ceil(Math.min(textWidth, metadata.width));
//             const svgHeight = Math.ceil(Math.min(textHeight, metadata.height));

//             compositeTop = Math.max(0, Math.min(watermarkY, metadata.height - svgHeight));
//             compositeLeft = Math.max(0, Math.min(watermarkX, metadata.width - svgWidth));

//             const svgText = `
//                 <svg width="${svgWidth}" height="${svgHeight}">
//                     <text
//                         x="0"
//                         y="${fontSize}"
//                         font-family="Helvetica, Arial, sans-serif"
//                         font-size="${fontSize}"
//                         fill="${watermarkColor}"
//                         opacity="${watermarkOpacity}"
//                         ${rotationAngle !== 0 ? `transform="rotate(${rotationAngle}, ${svgWidth / 2}, ${svgHeight / 2})"` : ""}
//                     >
//                         ${watermarkText}
//                     </text>
//                 </svg>
//             `;

//             overlayBuffer = await sharp(Buffer.from(svgText)).png().toBuffer();

//             const overlayMetadata = await sharp(overlayBuffer).metadata();
//             console.log("Text Overlay Metadata:", {
//                 width: overlayMetadata.width,
//                 height: overlayMetadata.height,
//                 composite: { top: compositeTop, left: compositeLeft },
//             });

//             if (overlayMetadata.width > metadata.width || overlayMetadata.height > metadata.height) {
//                 overlayBuffer = await sharp(overlayBuffer)
//                     .resize({
//                         width: Math.min(overlayMetadata.width, metadata.width),
//                         height: Math.min(overlayMetadata.height, metadata.height),
//                         fit: "inside",
//                         background: { r: 0, g: 0, b: 0, alpha: 0 },
//                     })
//                     .png()
//                     .toBuffer();
//             }
//         } else {
//             const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
//             const logoMetadata = await sharp(logoBuffer).metadata();
//             if (!logoMetadata.width || !logoMetadata.height) {
//                 return NextResponse.json({ error: "Invalid logo image metadata" }, { status: 400 });
//             }

//             // Cap logo width to 30% of image width to match client preview
//             const maxLogoWidth = Math.round(Math.min(metadata.width * 0.3, metadata.width * (watermarkSize / 100)));
//             const logoWidth = Math.round(Math.min(maxLogoWidth, metadata.width * 0.5));
//             const logoHeight = Math.round((logoWidth / logoMetadata.width) * logoMetadata.height);

//             // Ensure logo fits within base image
//             const finalLogoWidth = Math.min(logoWidth, metadata.width);
//             const finalLogoHeight = Math.min(logoHeight, metadata.height);

//             console.log("Logo Resize Calculations:", {
//                 maxLogoWidth,
//                 logoWidth,
//                 logoHeight,
//                 finalLogoWidth,
//                 finalLogoHeight,
//                 imageWidth: metadata.width,
//                 imageHeight: metadata.height,
//                 watermarkSize,
//             });

//             compositeTop = Math.max(0, Math.min(watermarkY, metadata.height - finalLogoHeight));
//             compositeLeft = Math.max(0, Math.min(watermarkX, metadata.width - finalLogoWidth));

//             overlayBuffer = await sharp(logoBuffer)
//                 .resize(finalLogoWidth, finalLogoHeight, {
//                     fit: "contain",
//                     background: { r: 0, g: 0, b: 0, alpha: 0 },
//                 })
//                 .rotate(rotationAngle)
//                 .png()
//                 .toBuffer();

//             const overlayMetadata = await sharp(overlayBuffer).metadata();
//             console.log("Logo Overlay Metadata:", {
//                 width: overlayMetadata.width,
//                 height: overlayMetadata.height,
//                 composite: { top: compositeTop, left: compositeLeft },
//             });

//             // Double-check overlay size
//             if (overlayMetadata.width > metadata.width || overlayMetadata.height > metadata.height) {
//                 console.log("Resizing logo overlay to fit base image:", {
//                     original: { width: overlayMetadata.width, height: overlayMetadata.height },
//                     target: { width: metadata.width, height: metadata.height },
//                 });
//                 overlayBuffer = await sharp(overlayBuffer)
//                     .resize({
//                         width: Math.min(overlayMetadata.width, metadata.width),
//                         height: Math.min(overlayMetadata.height, metadata.height),
//                         fit: "inside",
//                         background: { r: 0, g: 0, b: 0, alpha: 0 },
//                     })
//                     .png()
//                     .toBuffer();
//             }
//         }

//         const watermarkedBuffer = await sharpImage
//             .composite([
//                 {
//                     input: overlayBuffer,
//                     top: Math.round(compositeTop),
//                     left: Math.round(compositeLeft),
//                     blend: "over",
//                 },
//             ])
//             .toBuffer();

//         const isJpeg = imageFile.name.toLowerCase().endsWith(".jpg") || imageFile.name.toLowerCase().endsWith(".jpeg");
//         const outputFormat = isJpeg ? "jpeg" : "png";
//         const outputBuffer = await sharp(watermarkedBuffer)
//             .toFormat(outputFormat, { quality: isJpeg ? 95 : undefined })
//             .toBuffer();

//         const base64Image = `data:image/${outputFormat};base64,${outputBuffer.toString("base64")}`;
//         const watermarkedFilename = `watermarked_${uuidv4()}_${imageFile.name}`;
//         const outputPath = path.join(UPLOAD_DIR, watermarkedFilename);
//         await fs.writeFile(outputPath, outputBuffer);

//         return NextResponse.json({
//             success: true,
//             image_data: base64Image,
//             watermarked_filename: watermarkedFilename,
//         });
//     } catch (error) {
//         console.error("Watermark processing error:", error);
//         const errorMessage = error instanceof Error
//             ? `Failed to process watermark: ${error.message}`
//             : "Failed to process watermark: Unknown error";
//         return NextResponse.json({ error: errorMessage }, { status: 500 });
//     }
// }











// import { NextResponse } from "next/server";
// import sharp from "sharp";
// import { v4 as uuidv4 } from "uuid";
// import path from "path";
// import { promises as fs } from "fs";

// const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
// const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif"]);

// async function ensureUploadDir() {
//     await fs.mkdir(UPLOAD_DIR, { recursive: true });
// }

// function allowedFile(filename) {
//     const ext = filename.split(".").pop()?.toLowerCase();
//     return ext && ALLOWED_EXTENSIONS.has(ext);
// }

// export async function POST(request) {
//     try {
//         await ensureUploadDir();

//         const formData = await request.formData();
//         const imageFile = formData.get("image");
//         const logoFile = formData.get("logo");
//         const watermarkType = formData.get("watermark_type");
//         const watermarkText = formData.get("watermark_text");
//         const watermarkX = parseInt(formData.get("watermark_x")) || 0;
//         const watermarkY = parseInt(formData.get("watermark_y")) || 0;
//         const watermarkOpacity = parseFloat(formData.get("watermark_opacity")) || 0.5;
//         const watermarkSize = parseInt(formData.get("watermark_size")) || 30;
//         const watermarkColor = formData.get("watermark_color") || "#ffffff";
//         const rotationAngle = parseInt(formData.get("rotation_angle")) || 0;

//         console.log("API Received Parameters:", {
//             watermarkX,
//             watermarkY,
//             watermarkSize,
//             watermarkType,
//             rotationAngle,
//             opacity: watermarkOpacity,
//         });

//         if (!imageFile || !allowedFile(imageFile.name)) {
//             return NextResponse.json({ error: "Invalid or missing image file" }, { status: 400 });
//         }

//         if (watermarkType === "logo" && (!logoFile || !allowedFile(logoFile.name))) {
//             return NextResponse.json({ error: "Invalid or missing logo file" }, { status: 400 });
//         }

//         // Step 1: Resize the base image to max height 600
//         const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
//         const maxHeight = 600;
//         const resizedImageBuffer = await sharp(imageBuffer)
//             .resize({
//                 height: maxHeight,
//                 fit: "contain",
//                 background: { r: 0, g: 0, b: 0, alpha: 0 },
//                 withoutEnlargement: true,
//             })
//             .toBuffer();

//         let sharpImage = sharp(resizedImageBuffer).ensureAlpha();
//         const metadata = await sharpImage.metadata();
//         if (!metadata.width || !metadata.height) {
//             return NextResponse.json({ error: "Invalid image metadata" }, { status: 400 });
//         }

//         console.log("Base Image Metadata:", {
//             width: metadata.width,
//             height: metadata.height,
//         });

//         let overlayBuffer;
//         let compositeTop = watermarkY;
//         let compositeLeft = watermarkX;

//         if (watermarkType === "text") {
//             if (!watermarkText) {
//                 return NextResponse.json({ error: "No text provided for text watermark" }, { status: 400 });
//             }

//             const fontSize = Math.max(10, Math.min(watermarkSize, Math.floor(metadata.width * 0.1)));
//             const textWidth = Math.min(watermarkText.length * fontSize * 0.6, metadata.width * 0.8);
//             const textHeight = fontSize * 1.2;
//             const svgWidth = Math.ceil(Math.min(textWidth, metadata.width));
//             const svgHeight = Math.ceil(Math.min(textHeight, metadata.height));

//             compositeTop = Math.max(0, Math.min(watermarkY, metadata.height - svgHeight));
//             compositeLeft = Math.max(0, Math.min(watermarkX, metadata.width - svgWidth));

//             const svgText = `
//                 <svg width="${svgWidth}" height="${svgHeight}">
//                     <text
//                         x="0"
//                         y="${fontSize}"
//                         font-family="Helvetica, Arial, sans-serif"
//                         font-size="${fontSize}"
//                         fill="${watermarkColor}"
//                         opacity="${watermarkOpacity}"
//                         ${rotationAngle !== 0 ? `transform="rotate(${rotationAngle}, ${svgWidth / 2}, ${svgHeight / 2})"` : ""}
//                     >
//                         ${watermarkText}
//                     </text>
//                 </svg>
//             `;

//             overlayBuffer = await sharp(Buffer.from(svgText)).png().toBuffer();

//             const overlayMetadata = await sharp(overlayBuffer).metadata();
//             console.log("Text Overlay Metadata:", {
//                 width: overlayMetadata.width,
//                 height: overlayMetadata.height,
//                 composite: { top: compositeTop, left: compositeLeft },
//             });

//             // Ensure overlay fits within base image
//             if (overlayMetadata.width > metadata.width || overlayMetadata.height > metadata.height) {
//                 overlayBuffer = await sharp(overlayBuffer)
//                     .resize({
//                         width: Math.floor(Math.min(overlayMetadata.width, metadata.width)),
//                         height: Math.floor(Math.min(overlayMetadata.height, metadata.height)),
//                         fit: "inside",
//                         background: { r: 0, g: 0, b: 0, alpha: 0 },
//                     })
//                     .png()
//                     .toBuffer();
//             }
//         } else {
//             const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
//             const logoMetadata = await sharp(logoBuffer).metadata();
//             if (!logoMetadata.width || !logoMetadata.height) {
//                 return NextResponse.json({ error: "Invalid logo image metadata" }, { status: 400 });
//             }

//             // Calculate logo size with integer values
//             const maxLogoWidth = Math.floor(Math.min(metadata.width * 0.3, metadata.width * (watermarkSize / 100)));
//             const logoWidth = Math.min(maxLogoWidth, metadata.width);
//             const logoHeight = Math.floor((logoWidth / logoMetadata.width) * logoMetadata.height);

//             const finalLogoWidth = Math.floor(Math.min(logoWidth, metadata.width));
//             const finalLogoHeight = Math.floor(Math.min(logoHeight, metadata.height));

//             console.log("Logo Resize Calculations:", {
//                 maxLogoWidth,
//                 logoWidth,
//                 logoHeight,
//                 finalLogoWidth,
//                 finalLogoHeight,
//                 imageWidth: metadata.width,
//                 imageHeight: metadata.height,
//                 watermarkSize,
//             });

//             // Ensure alpha channel before any processing
//             let logoSharp = sharp(logoBuffer).ensureAlpha();

//             // Resize and rotate
//             logoSharp = logoSharp.resize(finalLogoWidth, finalLogoHeight, {
//                 fit: "contain",
//                 background: { r: 0, g: 0, b: 0, alpha: 0 },
//             });

//             if (rotationAngle !== 0) {
//                 logoSharp = logoSharp.rotate(rotationAngle, {
//                     background: { r: 0, g: 0, b: 0, alpha: 0 },
//                 });
//             }

//             // Convert to buffer and verify alpha channel
//             let logoWithAlpha = await logoSharp.png().toBuffer();
//             const logoWithAlphaMetadata = await sharp(logoWithAlpha).metadata();
//             if (!logoWithAlphaMetadata.hasAlpha) {
//                 console.warn("Logo image lacks alpha channel after ensureAlpha; reapplying");
//                 logoWithAlpha = await sharp(logoWithAlpha).ensureAlpha().png().toBuffer();
//             }

//             // Apply opacity
//             try {
//                 const alphaChannel = await sharp(logoWithAlpha)
//                     .extractChannel("alpha")
//                     .linear(watermarkOpacity)
//                     .toBuffer();
//                 const rgbChannels = await sharp(logoWithAlpha)
//                     .extract({ channel: 0, count: 3 })
//                     .toBuffer();
//                 overlayBuffer = await sharp(rgbChannels)
//                     .joinChannel(alphaChannel)
//                     .png()
//                     .toBuffer();
//             } catch (alphaError) {
//                 console.error("Alpha channel processing failed:", alphaError);
//                 // Fallback: Use logo without opacity adjustment
//                 overlayBuffer = logoWithAlpha;
//             }

//             const overlayMetadata = await sharp(overlayBuffer).metadata();
//             console.log("Logo Overlay Metadata:", {
//                 width: overlayMetadata.width,
//                 height: overlayMetadata.height,
//                 composite: { top: compositeTop, left: compositeLeft },
//             });

//             // Ensure overlay fits within base image
//             if (overlayMetadata.width > metadata.width || overlayMetadata.height > metadata.height) {
//                 console.log("Resizing logo overlay to fit base image:", {
//                     original: { width: overlayMetadata.width, height: overlayMetadata.height },
//                     target: { width: metadata.width, height: metadata.height },
//                 });
//                 overlayBuffer = await sharp(overlayBuffer)
//                     .resize({
//                         width: Math.floor(Math.min(overlayMetadata.width, metadata.width)),
//                         height: Math.floor(Math.min(overlayMetadata.height, metadata.height)),
//                         fit: "inside",
//                         background: { r: 0, g: 0, b: 0, alpha: 0 },
//                     })
//                     .png()
//                     .toBuffer();
//             }

//             // Clamp composite coordinates
//             compositeTop = Math.max(0, Math.min(watermarkY, metadata.height - overlayMetadata.height));
//             compositeLeft = Math.max(0, Math.min(watermarkX, metadata.width - overlayMetadata.width));
//         }

//         const watermarkedBuffer = await sharpImage
//             .composite([
//                 {
//                     input: overlayBuffer,
//                     top: Math.round(compositeTop),
//                     left: Math.round(compositeLeft),
//                     blend: "over",
//                 },
//             ])
//             .toBuffer();

//         const isJpeg = imageFile.name.toLowerCase().endsWith(".jpg") || imageFile.name.toLowerCase().endsWith(".jpeg");
//         const outputFormat = isJpeg ? "jpeg" : "png";
//         const outputBuffer = await sharp(watermarkedBuffer)
//             .toFormat(outputFormat, { quality: isJpeg ? 95 : undefined })
//             .toBuffer();

//         const base64Image = `data:image/${outputFormat};base64,${outputBuffer.toString("base64")}`;
//         const watermarkedFilename = `watermarked_${uuidv4()}_${imageFile.name}`;
//         const outputPath = path.join(UPLOAD_DIR, watermarkedFilename);
//         await fs.writeFile(outputPath, outputBuffer);

//         return NextResponse.json({
//             success: true,
//             image_data: base64Image,
//             watermarked_filename: watermarkedFilename,
//         });
//     } catch (error) {
//         console.error("Watermark processing error:", error);
//         const errorMessage = error instanceof Error
//             ? `Failed to process watermark: ${error.message}`
//             : "Failed to process watermark: Unknown error";
//         return NextResponse.json({ error: errorMessage }, { status: 500 });
//     }
// }





import { NextResponse } from "next/server";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif"]);

function allowedFile(filename) {
    const ext = filename.split(".").pop()?.toLowerCase();
    return ext && ALLOWED_EXTENSIONS.has(ext);
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        const imageFile = formData.get("image");
        const logoFile = formData.get("logo");
        const watermarkType = formData.get("watermark_type");
        const watermarkText = formData.get("watermark_text");
        const watermarkX = parseInt(formData.get("watermark_x")) || 0;
        const watermarkY = parseInt(formData.get("watermark_y")) || 0;
        const watermarkOpacity = parseFloat(formData.get("watermark_opacity")) || 0.5;
        const watermarkSize = parseInt(formData.get("watermark_size")) || 30;
        const watermarkColor = formData.get("watermark_color") || "#ffffff";
        const rotationAngle = parseInt(formData.get("rotation_angle")) || 0;

        console.log("API Received Parameters:", {
            watermarkX,
            watermarkY,
            watermarkSize,
            watermarkType,
            rotationAngle,
            opacity: watermarkOpacity,
        });

        if (!imageFile || !allowedFile(imageFile.name)) {
            return NextResponse.json({ error: "Invalid or missing image file" }, { status: 400 });
        }

        if (watermarkType === "logo" && (!logoFile || !allowedFile(logoFile.name))) {
            return NextResponse.json({ error: "Invalid or missing logo file" }, { status: 400 });
        }

        // Step 1: Resize the base image to max height 600
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const maxHeight = 600;
        const resizedImageBuffer = await sharp(imageBuffer)
            .resize({
                height: maxHeight,
                fit: "contain",
                background: { r: 0, g: 0, b: 0, alpha: 0 },
                withoutEnlargement: true,
            })
            .toBuffer();

        let sharpImage = sharp(resizedImageBuffer).ensureAlpha();
        const metadata = await sharpImage.metadata();
        if (!metadata.width || !metadata.height) {
            return NextResponse.json({ error: "Invalid image metadata" }, { status: 400 });
        }

        console.log("Base Image Metadata:", {
            width: metadata.width,
            height: metadata.height,
        });

        let overlayBuffer;
        let compositeTop = watermarkY;
        let compositeLeft = watermarkX;

        if (watermarkType === "text") {
            if (!watermarkText) {
                return NextResponse.json({ error: "No text provided for text watermark" }, { status: 400 });
            }

            const fontSize = Math.max(10, Math.min(watermarkSize, Math.floor(metadata.width * 0.1)));
            const textWidth = Math.min(watermarkText.length * fontSize * 0.6, metadata.width * 0.8);
            const textHeight = fontSize * 1.2;
            const svgWidth = Math.floor(Math.min(textWidth, metadata.width));
            const svgHeight = Math.floor(Math.min(textHeight, metadata.height));

            compositeTop = Math.max(0, Math.min(watermarkY, metadata.height - svgHeight));
            compositeLeft = Math.max(0, Math.min(watermarkX, metadata.width - svgWidth));

            const svgText = `
                <svg width="${svgWidth}" height="${svgHeight}">
                    <text
                        x="0"
                        y="${fontSize}"
                        font-family="Helvetica, Arial, sans-serif"
                        font-size="${fontSize}"
                        fill="${watermarkColor}"
                        opacity="${watermarkOpacity}"
                        ${rotationAngle !== 0 ? `transform="rotate(${rotationAngle}, ${svgWidth / 2}, ${svgHeight / 2})"` : ""}
                    >
                        ${watermarkText}
                    </text>
                </svg>
            `;

            overlayBuffer = await sharp(Buffer.from(svgText)).png().toBuffer();

            const overlayMetadata = await sharp(overlayBuffer).metadata();
            console.log("Text Overlay Metadata:", {
                width: overlayMetadata.width,
                height: overlayMetadata.height,
                composite: { top: compositeTop, left: compositeLeft },
            });

            // Ensure overlay fits within base image
            if (overlayMetadata.width > metadata.width || overlayMetadata.height > metadata.height) {
                overlayBuffer = await sharp(overlayBuffer)
                    .resize({
                        width: Math.floor(Math.min(overlayMetadata.width, metadata.width)),
                        height: Math.floor(Math.min(overlayMetadata.height, metadata.height)),
                        fit: "inside",
                        background: { r: 0, g: 0, b: 0, alpha: 0 },
                    })
                    .png()
                    .toBuffer();
            }
        } else {
            const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
            const logoMetadata = await sharp(logoBuffer).metadata();
            if (!logoMetadata.width || !logoMetadata.height || !logoMetadata.format) {
                console.error("Invalid logo metadata:", logoMetadata);
                return NextResponse.json({ error: "Invalid logo image metadata" }, { status: 400 });
            }

            console.log("Logo Image Metadata:", {
                width: logoMetadata.width,
                height: logoMetadata.height,
                format: logoMetadata.format,
                hasAlpha: logoMetadata.hasAlpha,
            });

            // Calculate logo size with integer values
            const maxLogoWidth = Math.floor(Math.min(metadata.width * 0.3, metadata.width * (watermarkSize / 100)));
            const logoWidth = Math.floor(Math.min(maxLogoWidth, metadata.width));
            const logoHeight = Math.floor((logoWidth / logoMetadata.width) * logoMetadata.height);

            const finalLogoWidth = Math.floor(Math.min(logoWidth, metadata.width));
            const finalLogoHeight = Math.floor(Math.min(logoHeight, metadata.height));

            console.log("Logo Resize Calculations:", {
                maxLogoWidth,
                logoWidth,
                logoHeight,
                finalLogoWidth,
                finalLogoHeight,
                imageWidth: metadata.width,
                imageHeight: metadata.height,
                watermarkSize,
            });

            // Process logo with alpha channel
            let logoSharp = sharp(logoBuffer).ensureAlpha();
            logoSharp = logoSharp.resize(finalLogoWidth, finalLogoHeight, {
                fit: "contain",
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            });

            if (rotationAngle !== 0) {
                logoSharp = logoSharp.rotate(rotationAngle, {
                    background: { r: 0, g: 0, b: 0, alpha: 0 },
                });
            }

            // Convert to buffer with raw pixel data
            let logoWithAlpha = await logoSharp
                .raw()
                .toBuffer({ resolveWithObject: true });

            const logoWithAlphaMetadata = await sharp(logoWithAlpha.data, {
                raw: {
                    width: finalLogoWidth,
                    height: finalLogoHeight,
                    channels: 4,
                },
            }).metadata();

            if (!logoWithAlphaMetadata.width || !logoWithAlphaMetadata.height || !logoWithAlphaMetadata.format) {
                console.error("Invalid logo buffer metadata after processing:", logoWithAlphaMetadata);
                return NextResponse.json({ error: "Failed to process logo image" }, { status: 500 });
            }
            if (!logoWithAlphaMetadata.hasAlpha) {
                console.warn("Logo lacks alpha channel after ensureAlpha; reapplying");
                logoWithAlpha = await sharp(logoWithAlpha.data, {
                    raw: {
                        width: finalLogoWidth,
                        height: finalLogoHeight,
                        channels: 4,
                    },
                })
                    .ensureAlpha()
                    .raw()
                    .toBuffer({ resolveWithObject: true });
            }

            // Apply opacity to alpha channel
            try {
                // Convert logo to raw RGBA data
                const { data: logoData, info } = logoWithAlpha;
                const pixelCount = info.width * info.height;

                // Create a new buffer to adjust alpha
                const adjustedData = Buffer.alloc(pixelCount * 4);
                for (let i = 0; i < pixelCount; i++) {
                    const offset = i * 4;
                    adjustedData[offset] = logoData[offset]; // R
                    adjustedData[offset + 1] = logoData[offset + 1]; // G
                    adjustedData[offset + 2] = logoData[offset + 2]; // B
                    adjustedData[offset + 3] = Math.round(logoData[offset + 3] * watermarkOpacity); // A * opacity
                }

                // Log sample alpha value
                const sampleAlpha = adjustedData[3]; // First pixel's alpha
                console.log("Alpha Channel Sample:", {
                    sampleAlpha,
                    expectedAlpha: Math.round(watermarkOpacity * 255),
                });

                // Convert back to PNG
                overlayBuffer = await sharp(adjustedData, {
                    raw: {
                        width: info.width,
                        height: info.height,
                        channels: 4,
                    },
                })
                    .png({ force: true })
                    .toBuffer();
            } catch (alphaError) {
                console.error("Alpha channel processing failed:", alphaError);
                // Fallback: Use composite with opacity
                overlayBuffer = await sharp(logoWithAlpha.data, {
                    raw: {
                        width: finalLogoWidth,
                        height: finalLogoHeight,
                        channels: 4,
                    },
                })
                    .png({ force: true })
                    .toBuffer();
            }

            const overlayMetadata = await sharp(overlayBuffer).metadata();
            if (!overlayMetadata.width || !overlayMetadata.height || !overlayMetadata.format) {
                console.error("Invalid overlay metadata after processing:", overlayMetadata);
                return NextResponse.json({ error: "Failed to process logo image" }, { status: 500 });
            }

            console.log("Logo Overlay Metadata:", {
                width: overlayMetadata.width,
                height: overlayMetadata.height,
                format: overlayMetadata.format,
                hasAlpha: overlayMetadata.hasAlpha,
                composite: { top: compositeTop, left: compositeLeft },
                appliedOpacity: watermarkOpacity,
            });

            // Ensure overlay fits within base image
            if (overlayMetadata.width > metadata.width || overlayMetadata.height > metadata.height) {
                console.log("Resizing logo overlay to fit base image:", {
                    original: { width: overlayMetadata.width, height: overlayMetadata.height },
                    target: { width: metadata.width, height: metadata.height },
                });
                overlayBuffer = await sharp(overlayBuffer)
                    .resize({
                        width: Math.floor(Math.min(overlayMetadata.width, metadata.width)),
                        height: Math.floor(Math.min(overlayMetadata.height, metadata.height)),
                        fit: "inside",
                        background: { r: 0, g: 0, b: 0, alpha: 0 },
                    })
                    .png({ force: true })
                    .toBuffer();
            }

            // Clamp composite coordinates
            compositeTop = Math.max(0, Math.min(watermarkY, metadata.height - overlayMetadata.height));
            compositeLeft = Math.max(0, Math.min(watermarkX, metadata.width - overlayMetadata.width));
        }

        const watermarkedBuffer = await sharpImage
            .composite([
                {
                    input: overlayBuffer,
                    top: Math.round(compositeTop),
                    left: Math.round(compositeLeft),
                    blend: "over",
                },
            ])
            .toBuffer();

        const isJpeg = imageFile.name.toLowerCase().endsWith(".jpg") || imageFile.name.toLowerCase().endsWith(".jpeg");
        const outputFormat = isJpeg ? "jpeg" : "png";
        const outputBuffer = await sharp(watermarkedBuffer)
            .toFormat(outputFormat, { quality: isJpeg ? 95 : undefined })
            .toBuffer();

        const base64Image = `data:image/${outputFormat};base64,${outputBuffer.toString("base64")}`;
        const watermarkedFilename = `watermarked_${uuidv4()}_${imageFile.name}`;

        return NextResponse.json({
            success: true,
            image_data: base64Image,
            watermarked_filename: watermarkedFilename,
        });
    } catch (error) {
        console.error("Watermark processing error:", error);
        const errorMessage = error instanceof Error
            ? `Failed to process watermark: ${error.message}`
            : "Failed to process watermark: Unknown error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}