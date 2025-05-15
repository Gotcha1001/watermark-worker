// "use client";
// import { useState, useRef, useEffect } from "react";
// import NextImage from "next/image";
// import ImageUpload from "../components/ImageUpload";
// import WatermarkTypeSelector from "../components/WatermarkTypeSelector";
// import TextWatermarkSettings from "../components/TextwatermarkSettings";
// import LogoWatermarkSettings from "../components/LogoWatermarkSettings";
// import WatermarkSettings from "../components/WatermarkSettings";

// export default function Editor() {
//     const [image, setImage] = useState(null);
//     const [watermarkType, setWatermarkType] = useState("text");
//     const [watermarkText, setWatermarkText] = useState("Your Watermark");
//     const [textSize, setTextSize] = useState(30);
//     const [textColor, setTextColor] = useState("#ffffff");
//     const [logoFile, setLogoFile] = useState(null);
//     const [logoSize, setLogoSize] = useState(30);
//     const [opacity, setOpacity] = useState(50);
//     const [rotation, setRotation] = useState(0);
//     const [message, setMessage] = useState(null);
//     const [showWatermarked, setShowWatermarked] = useState(false);
//     const previewContainerRef = useRef(null);
//     const watermarkPreviewRef = useRef(null);
//     const logoPreviewRef = useRef(null);
//     const imageRef = useRef(null);
//     const [displayedDimensions, setDisplayedDimensions] = useState({ width: 0, height: 0 });
//     const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });

//     const handleImageUpload = (file) => {
//         const img = new window.Image();
//         img.src = URL.createObjectURL(file);
//         img.onload = () => {
//             setImage({
//                 id: crypto.randomUUID(),
//                 file,
//                 preview: img.src,
//                 naturalWidth: img.naturalWidth,
//                 naturalHeight: img.naturalHeight,
//                 watermarkPosition: { x: 0, y: 0 },
//             });
//             setShowWatermarked(false);
//         };
//     };

//     const handleLogoUpload = (file) => {
//         setLogoFile(file);
//         updateLogoPreview();
//     };

//     const handleApplyWatermark = async () => {
//         if (!image) {
//             setMessage({ title: "Error", text: "Please upload an image first." });
//             return;
//         }
//         if (watermarkType === "logo" && !logoFile) {
//             setMessage({ title: "Error", text: "Please upload a logo first." });
//             return;
//         }

//         const imageElement = imageRef.current;
//         if (!imageElement) {
//             setMessage({ title: "Error", text: "Image element not found." });
//             return;
//         }

//         const { width: displayedWidth, height: displayedHeight } = displayedDimensions;
//         if (displayedWidth <= 0 || displayedHeight <= 0) {
//             setMessage({ title: "Error", text: "Image dimensions not loaded." });
//             return;
//         }

//         // Calculate server-side resized dimensions (same as API)
//         const maxHeight = 600;
//         const aspectRatio = image.naturalWidth / image.naturalHeight;
//         let resizedWidth, resizedHeight;
//         if (image.naturalHeight > maxHeight) {
//             resizedHeight = maxHeight;
//             resizedWidth = Math.round(maxHeight * aspectRatio);
//         } else {
//             resizedHeight = image.naturalHeight;
//             resizedWidth = image.naturalWidth;
//         }

//         // Get watermark dimensions from server-side calculations
//         let watermarkWidth = watermarkType === "text" ? Math.min(watermarkText.length * textSize * 0.6, resizedWidth * 0.8) : (resizedWidth * logoSize) / 100;
//         let watermarkHeight = watermarkType === "text" ? textSize * 1.2 : (watermarkWidth / 2) * 1.75; // Approximate logo aspect ratio

//         // Adjust drag coordinates to be relative to the image's top-left corner
//         let adjustedX = image.watermarkPosition.x - imageOffset.x;
//         let adjustedY = image.watermarkPosition.y - imageOffset.y;

//         // Scale coordinates to resized image dimensions
//         const scaleX = resizedWidth / displayedWidth;
//         const scaleY = resizedHeight / displayedHeight;
//         let scaledX = adjustedX * scaleX;
//         let scaledY = adjustedY * scaleY;

//         // Clamp coordinates to ensure watermark stays within bounds
//         scaledX = Math.max(0, Math.min(scaledX, resizedWidth - watermarkWidth));
//         scaledY = Math.max(0, Math.min(scaledY, resizedHeight - watermarkHeight));

//         console.log("Apply Watermark Debug:", {
//             displayed: { width: displayedWidth, height: displayedHeight },
//             natural: { width: image.naturalWidth, height: image.naturalHeight },
//             resized: { width: resizedWidth, height: resizedHeight },
//             watermark: { width: watermarkWidth, height: watermarkHeight },
//             dragPosition: { x: image.watermarkPosition.x, y: image.watermarkPosition.y },
//             imageOffset: { x: imageOffset.x, y: imageOffset.y },
//             adjustedPosition: { x: adjustedX, y: adjustedY },
//             scale: { x: scaleX, y: scaleY },
//             scaledPosition: { x: scaledX, y: scaledY },
//         });

//         const formData = new FormData();
//         formData.append("image", image.file);
//         if (logoFile) formData.append("logo", logoFile);
//         formData.append("watermark_type", watermarkType);
//         formData.append("watermark_text", watermarkText);
//         formData.append("watermark_x", Math.round(scaledX).toString());
//         formData.append("watermark_y", Math.round(scaledY).toString());
//         formData.append("watermark_opacity", (opacity / 100).toString());
//         formData.append("watermark_size", (watermarkType === "text" ? textSize : logoSize).toString());
//         formData.append("watermark_color", textColor);
//         formData.append("rotation_angle", rotation.toString());

//         try {
//             const response = await fetch("/api/watermark", {
//                 method: "POST",
//                 body: formData,
//             });
//             const data = await response.json();
//             console.log("API Response:", data);
//             if (data.success) {
//                 setImage((prev) => ({ ...prev, watermarked: data.image_data }));
//                 if (watermarkPreviewRef.current) watermarkPreviewRef.current.style.display = "none";
//                 if (logoPreviewRef.current) logoPreviewRef.current.style.display = "none";
//                 setShowWatermarked(true);
//                 setMessage({ title: "Success", text: "Watermark applied successfully!" });
//             } else {
//                 setMessage({ title: "Error", text: data.error || "Failed to apply watermark." });
//             }
//         } catch (error) {
//             setMessage({ title: "Error", text: "An error occurred while applying the watermark." });
//         }
//     };

//     const handleDownload = () => {
//         if (!image?.watermarked) {
//             setMessage({ title: "Error", text: "No watermarked image available for download." });
//             return;
//         }
//         const link = document.createElement("a");
//         link.href = image.watermarked;
//         link.download = `watermarked_${image.file.name}`;
//         link.click();
//     };

//     const updateTextPreview = () => {
//         if (!watermarkPreviewRef.current || !previewContainerRef.current || !imageRef.current) return;
//         const container = previewContainerRef.current.getBoundingClientRect();
//         const imageRect = imageRef.current.getBoundingClientRect();
//         watermarkPreviewRef.current.style.display = "block";
//         watermarkPreviewRef.current.style.fontSize = `${textSize}px`;
//         watermarkPreviewRef.current.style.color = textColor;
//         watermarkPreviewRef.current.style.opacity = (opacity / 100).toString();
//         watermarkPreviewRef.current.style.transform = `rotate(${rotation}deg)`;
//         watermarkPreviewRef.current.textContent = watermarkText;

//         // Ensure minimum size for dragging
//         watermarkPreviewRef.current.style.minWidth = `${watermarkText.length * textSize * 0.6}px`;
//         watermarkPreviewRef.current.style.minHeight = `${textSize * 1.2}px`;

//         // Force reflow to get accurate dimensions
//         watermarkPreviewRef.current.offsetHeight; // Trigger reflow

//         if (!image.watermarkPosition.x && !image.watermarkPosition.y) {
//             const watermarkWidth = watermarkPreviewRef.current.offsetWidth;
//             const watermarkHeight = watermarkPreviewRef.current.offsetHeight;
//             const initialTop = (imageRect.height - watermarkHeight) / 2 + imageOffset.y;
//             const initialLeft = (imageRect.width - watermarkWidth) / 2 + imageOffset.x;
//             watermarkPreviewRef.current.style.top = `${initialTop}px`;
//             watermarkPreviewRef.current.style.left = `${initialLeft}px`;
//             setImage((prev) => ({
//                 ...prev,
//                 watermarkPosition: { x: initialLeft, y: initialTop },
//             }));
//             console.log("Initial Text Preview Position:", { x: initialLeft, y: initialTop, watermarkWidth, watermarkHeight });
//         }
//     };

//     const updateLogoPreview = () => {
//         if (!logoPreviewRef.current || !previewContainerRef.current || !logoFile || !imageRef.current) return;
//         const container = previewContainerRef.current.getBoundingClientRect();
//         const imageRect = imageRef.current.getBoundingClientRect();
//         const containerWidth = imageRect.width;
//         logoPreviewRef.current.style.display = "block";
//         logoPreviewRef.current.src = URL.createObjectURL(logoFile);
//         logoPreviewRef.current.style.width = `${(containerWidth * logoSize) / 100}px`;
//         logoPreviewRef.current.style.opacity = (opacity / 100).toString();
//         logoPreviewRef.current.style.transform = `rotate(${rotation}deg)`;

//         // Force reflow to get accurate dimensions
//         logoPreviewRef.current.offsetHeight; // Trigger reflow

//         if (!image.watermarkPosition.x && !image.watermarkPosition.y) {
//             const logoWidth = logoPreviewRef.current.offsetWidth;
//             const logoHeight = logoPreviewRef.current.offsetHeight;
//             const initialTop = (imageRect.height - logoHeight) / 2 + imageOffset.y;
//             const initialLeft = (imageRect.width - logoWidth) / 2 + imageOffset.x;
//             logoPreviewRef.current.style.top = `${initialTop}px`;
//             logoPreviewRef.current.style.left = `${initialLeft}px`;
//             setImage((prev) => ({
//                 ...prev,
//                 watermarkPosition: { x: initialLeft, y: initialTop },
//             }));
//             console.log("Initial Logo Preview Position:", { x: initialLeft, y: initialTop, logoWidth, logoHeight });
//         }
//     };

//     useEffect(() => {
//         if (!image || !imageRef.current || !previewContainerRef.current) return;
//         const containerRect = previewContainerRef.current.getBoundingClientRect();
//         const imageRect = imageRef.current.getBoundingClientRect();
//         setImageOffset({
//             x: imageRect.left - containerRect.left,
//             y: imageRect.top - containerRect.top,
//         });
//         console.log("Image Offset:", {
//             x: imageRect.left - containerRect.left,
//             y: imageRect.top - containerRect.top,
//             imageRect,
//             containerRect,
//         });

//         if (watermarkType === "text") {
//             updateTextPreview();
//         } else {
//             updateLogoPreview();
//         }
//         if (watermarkPreviewRef.current) {
//             watermarkPreviewRef.current.style.display =
//                 watermarkType === "text" && !showWatermarked ? "block" : "none";
//         }
//         if (logoPreviewRef.current) {
//             logoPreviewRef.current.style.display =
//                 watermarkType === "logo" && logoFile && !showWatermarked ? "block" : "none";
//         }
//     }, [
//         watermarkText,
//         textSize,
//         textColor,
//         opacity,
//         rotation,
//         logoSize,
//         watermarkType,
//         logoFile,
//         showWatermarked,
//         image,
//     ]);

//     const makeDraggable = (element) => {
//         let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

//         const dragMouseDown = (e) => {
//             e.preventDefault();
//             pos3 = e.clientX;
//             pos4 = e.clientY;
//             document.onmouseup = closeDragElement;
//             document.onmousemove = elementDrag;
//         };

//         const elementDrag = (e) => {
//             e.preventDefault();
//             pos1 = pos3 - e.clientX;
//             pos2 = pos4 - e.clientY;
//             pos3 = e.clientX;
//             pos4 = e.clientY;

//             const container = previewContainerRef.current?.getBoundingClientRect();
//             const imageRect = imageRef.current?.getBoundingClientRect();
//             const elementRect = element.getBoundingClientRect();

//             let newTop = element.offsetTop - pos2;
//             let newLeft = element.offsetLeft - pos1;

//             if (container && imageRect) {
//                 const minLeft = imageOffset.x;
//                 const minTop = imageOffset.y;
//                 const maxLeft = imageOffset.x + imageRect.width - elementRect.width;
//                 const maxTop = imageOffset.x + imageRect.height - elementRect.height;

//                 newTop = Math.max(minTop, Math.min(newTop, maxTop));
//                 newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));

//                 element.style.top = `${newTop}px`;
//                 element.style.left = `${newLeft}px`;

//                 if (image) {
//                     setImage((prev) => ({
//                         ...prev,
//                         watermarkPosition: { x: newLeft, y: newTop },
//                     }));
//                     console.log("Drag Position:", {
//                         type: watermarkType,
//                         x: newLeft,
//                         y: newTop,
//                         elementWidth: elementRect.width,
//                         elementHeight: elementRect.height,
//                         imageBounds: { width: imageRect.width, height: imageRect.height },
//                         offset: imageOffset,
//                     });
//                 }
//             }
//         };

//         const closeDragElement = () => {
//             document.onmouseup = null;
//             document.onmousemove = null;
//         };

//         element.onmousedown = dragMouseDown;
//     };

//     useEffect(() => {
//         if (watermarkPreviewRef.current) makeDraggable(watermarkPreviewRef.current);
//         if (logoPreviewRef.current) makeDraggable(logoPreviewRef.current);
//     }, [imageOffset, watermarkType, watermarkText, textSize, logoFile, logoSize]);

//     return (
//         <div className="min-h-screen bg-gray-100">
//             <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-6">
//                 <div className="container mx-auto px-4">
//                     <h1 className="text-3xl font-bold text-center">Watermark Editor</h1>
//                 </div>
//             </header>
//             <main className="container mx-auto px-4 py-8">
//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                     <div className="lg:col-span-2">
//                         <div className="bg-white shadow-lg rounded-lg overflow-hidden">
//                             <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
//                                 <h2 className="text-xl font-semibold">Image Preview</h2>
//                             </div>
//                             <div className="p-4">
//                                 <div
//                                     ref={previewContainerRef}
//                                     className="relative min-h-[300px] bg-gray-100 rounded-lg flex items-center justify-center"
//                                 >
//                                     {image ? (
//                                         <NextImage
//                                             ref={imageRef}
//                                             src={showWatermarked && image.watermarked ? image.watermarked : image.preview}
//                                             alt="Preview"
//                                             width={800}
//                                             height={600}
//                                             className="max-w-full max-h-[600px] object-contain"
//                                             style={{ width: "auto", height: "auto" }}
//                                             onLoadingComplete={(img) => {
//                                                 const rect = img.getBoundingClientRect();
//                                                 setDisplayedDimensions({
//                                                     width: rect.width,
//                                                     height: rect.height,
//                                                 });
//                                                 console.log("Image Loaded Dimensions:", {
//                                                     displayed: { width: rect.width, height: rect.height },
//                                                     natural: { width: img.naturalWidth, height: img.naturalHeight },
//                                                 });
//                                             }}
//                                         />
//                                     ) : (
//                                         <p className="text-gray-500">Upload an image to start</p>
//                                     )}
//                                     <div
//                                         ref={watermarkPreviewRef}
//                                         className={`absolute ${watermarkType === "text" && image && !showWatermarked ? "block" : "hidden"} bg-black/10 p-2 cursor-move`}
//                                     ></div>
//                                     <img
//                                         ref={logoPreviewRef}
//                                         className={`absolute ${watermarkType === "logo" && image && logoFile && !showWatermarked ? "block" : "hidden"} bg-black/10 p-1 cursor-move`}
//                                         alt="Logo preview"
//                                     />
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                     <div className="space-y-6">
//                         <ImageUpload onUpload={handleImageUpload} />
//                         <WatermarkTypeSelector watermarkType={watermarkType} setWatermarkType={setWatermarkType} />
//                         {watermarkType === "text" && (
//                             <TextWatermarkSettings
//                                 watermarkText={watermarkText}
//                                 setWatermarkText={setWatermarkText}
//                                 textSize={textSize}
//                                 setTextSize={setTextSize}
//                                 textColor={textColor}
//                                 setTextColor={setTextColor}
//                             />
//                         )}
//                         {watermarkType === "logo" && (
//                             <LogoWatermarkSettings
//                                 onLogoUpload={handleLogoUpload}
//                                 logoSize={logoSize}
//                                 setLogoSize={setLogoSize}
//                             />
//                         )}
//                         <WatermarkSettings
//                             image={image}
//                             opacity={opacity}
//                             setOpacity={setOpacity}
//                             rotation={rotation}
//                             setRotation={setRotation}
//                             onApply={handleApplyWatermark}
//                             onDownload={handleDownload}
//                         />
//                     </div>
//                 </div>
//             </main>
//             {message && (
//                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
//                     <div className="bg-white rounded-lg p-6 max-w-md w-full">
//                         <h3 className="text-lg font-semibold">{message.title}</h3>
//                         <p className="mt-2 text-gray-600">{message.text}</p>
//                         <button
//                             onClick={() => setMessage(null)}
//                             className="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded-full hover:bg-gray-300 transition"
//                         >
//                             Close
//                         </button>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }




// "use client";
// import { useState, useRef, useEffect } from "react";
// import NextImage from "next/image";
// import ImageUpload from "../components/ImageUpload";
// import WatermarkTypeSelector from "../components/WatermarkTypeSelector";
// import TextWatermarkSettings from "../components/TextwatermarkSettings";
// import LogoWatermarkSettings from "../components/LogoWatermarkSettings";
// import WatermarkSettings from "../components/WatermarkSettings";

// export default function Editor() {
//     const [image, setImage] = useState(null);
//     const [watermarkType, setWatermarkType] = useState("text");
//     const [watermarkText, setWatermarkText] = useState("Your Watermark");
//     const [textSize, setTextSize] = useState(30);
//     const [textColor, setTextColor] = useState("#ffffff");
//     const [logoFile, setLogoFile] = useState(null);
//     const [logoSize, setLogoSize] = useState(30);
//     const [opacity, setOpacity] = useState(50);
//     const [rotation, setRotation] = useState(0);
//     const [message, setMessage] = useState(null);
//     const [showWatermarked, setShowWatermarked] = useState(false);
//     const previewContainerRef = useRef(null);
//     const watermarkPreviewRef = useRef(null);
//     const logoPreviewRef = useRef(null);
//     const imageRef = useRef(null);
//     const [displayedDimensions, setDisplayedDimensions] = useState({ width: 0, height: 0 });
//     const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });

//     const handleImageUpload = (file) => {
//         const img = new window.Image();
//         img.src = URL.createObjectURL(file);
//         img.onload = () => {
//             setImage({
//                 id: crypto.randomUUID(),
//                 file,
//                 preview: img.src,
//                 naturalWidth: img.naturalWidth,
//                 naturalHeight: img.naturalHeight,
//                 watermarkPosition: { x: 0, y: 0 },
//             });
//             setShowWatermarked(false);
//         };
//     };

//     const handleLogoUpload = (file) => {
//         setLogoFile(file);
//         updateLogoPreview();
//     };

//     const handleApplyWatermark = async () => {
//         if (!image) {
//             setMessage({ title: "Error", text: "Please upload an image first." });
//             return;
//         }
//         if (watermarkType === "logo" && !logoFile) {
//             setMessage({ title: "Error", text: "Please upload a logo first." });
//             return;
//         }

//         const imageElement = imageRef.current;
//         if (!imageElement) {
//             setMessage({ title: "Error", text: "Image element not found." });
//             return;
//         }

//         const { width: displayedWidth, height: displayedHeight } = displayedDimensions;
//         if (displayedWidth <= 0 || displayedHeight <= 0) {
//             setMessage({ title: "Error", text: "Image dimensions not loaded." });
//             return;
//         }

//         // Calculate server-side resized dimensions (same as API)
//         const maxHeight = 600;
//         const aspectRatio = image.naturalWidth / image.naturalHeight;
//         let resizedWidth, resizedHeight;
//         if (image.naturalHeight > maxHeight) {
//             resizedHeight = maxHeight;
//             resizedWidth = Math.round(maxHeight * aspectRatio);
//         } else {
//             resizedHeight = image.naturalHeight;
//             resizedWidth = image.naturalWidth;
//         }

//         // Get watermark dimensions (aligned with server)
//         let watermarkWidth, watermarkHeight;
//         if (watermarkType === "text") {
//             const fontSize = textSize; // Match server
//             watermarkWidth = Math.min(watermarkText.length * fontSize * 0.6, resizedWidth * 0.8);
//             watermarkHeight = fontSize * 1.2;
//         } else {
//             watermarkWidth = (resizedWidth * logoSize) / 100;
//             watermarkHeight = watermarkWidth * (logoFile ? (await getImageAspectRatio(logoFile)) : 0.5714); // Default 1/1.75
//         }

//         // Adjust drag coordinates to be relative to the image's top-left corner
//         let adjustedX = image.watermarkPosition.x - imageOffset.x;
//         let adjustedY = image.watermarkPosition.y - imageOffset.y;

//         // Scale coordinates to resized image dimensions
//         const scaleX = resizedWidth / displayedWidth;
//         const scaleY = resizedHeight / displayedHeight;
//         let scaledX = adjustedX * scaleX;
//         let scaledY = adjustedY * scaleY;

//         // Clamp coordinates to ensure watermark stays within bounds
//         scaledX = Math.max(0, Math.min(scaledX, resizedWidth - watermarkWidth));
//         scaledY = Math.max(0, Math.min(scaledY, resizedHeight - watermarkHeight));

//         console.log("Apply Watermark Debug:", {
//             displayed: { width: displayedWidth, height: displayedHeight },
//             natural: { width: image.naturalWidth, height: image.naturalHeight },
//             resized: { width: resizedWidth, height: resizedHeight },
//             watermark: { width: watermarkWidth, height: watermarkHeight },
//             dragPosition: { x: image.watermarkPosition.x, y: image.watermarkPosition.y },
//             imageOffset: { x: imageOffset.x, y: imageOffset.y },
//             adjustedPosition: { x: adjustedX, y: adjustedY },
//             scale: { x: scaleX, y: scaleY },
//             scaledPosition: { x: scaledX, y: scaledY },
//         });

//         const formData = new FormData();
//         formData.append("image", image.file);
//         if (logoFile) formData.append("logo", logoFile);
//         formData.append("watermark_type", watermarkType);
//         formData.append("watermark_text", watermarkText);
//         formData.append("watermark_x", Math.round(scaledX).toString());
//         formData.append("watermark_y", Math.round(scaledY).toString());
//         formData.append("watermark_opacity", (opacity / 100).toString());
//         formData.append("watermark_size", (watermarkType === "text" ? textSize : logoSize).toString());
//         formData.append("watermark_color", textColor);
//         formData.append("rotation_angle", rotation.toString());

//         try {
//             const response = await fetch("/api/watermark", {
//                 method: "POST",
//                 body: formData,
//             });
//             const data = await response.json();
//             console.log("API Response:", data);
//             if (data.success) {
//                 setImage((prev) => ({ ...prev, watermarked: data.image_data }));
//                 if (watermarkPreviewRef.current) watermarkPreviewRef.current.style.display = "none";
//                 if (logoPreviewRef.current) logoPreviewRef.current.style.display = "none";
//                 setShowWatermarked(true);
//                 setMessage({ title: "Success", text: "Watermark applied successfully!" });
//             } else {
//                 setMessage({ title: "Error", text: data.error || "Failed to apply watermark." });
//             }
//         } catch (error) {
//             setMessage({ title: "Error", text: "An error occurred while applying the watermark." });
//         }
//     };

//     const handleDownload = () => {
//         if (!image?.watermarked) {
//             setMessage({ title: "Error", text: "No watermarked image available for download." });
//             return;
//         }
//         const link = document.createElement("a");
//         link.href = image.watermarked;
//         link.download = `watermarked_${image.file.name}`;
//         link.click();
//     };

//     const getImageAspectRatio = async (file) => {
//         return new Promise((resolve) => {
//             const img = new window.Image();
//             img.src = URL.createObjectURL(file);
//             img.onload = () => {
//                 resolve(img.naturalHeight / img.naturalWidth);
//             };
//         });
//     };

//     const updateTextPreview = () => {
//         if (!watermarkPreviewRef.current || !previewContainerRef.current || !imageRef.current) return;
//         const container = previewContainerRef.current.getBoundingClientRect();
//         const imageRect = imageRef.current.getBoundingClientRect();
//         watermarkPreviewRef.current.style.display = "block";
//         watermarkPreviewRef.current.style.fontSize = `${textSize}px`;
//         watermarkPreviewRef.current.style.color = textColor;
//         watermarkPreviewRef.current.style.opacity = (opacity / 100).toString();
//         watermarkPreviewRef.current.style.transform = `rotate(${rotation}deg)`;
//         watermarkPreviewRef.current.textContent = watermarkText;

//         // Match server-side dimensions
//         watermarkPreviewRef.current.style.width = `${watermarkText.length * textSize * 0.6}px`;
//         watermarkPreviewRef.current.style.height = `${textSize * 1.2}px`;

//         // Force reflow to get accurate dimensions
//         watermarkPreviewRef.current.offsetHeight; // Trigger reflow

//         if (!image.watermarkPosition.x && !image.watermarkPosition.y) {
//             const watermarkWidth = watermarkPreviewRef.current.offsetWidth;
//             const watermarkHeight = watermarkPreviewRef.current.offsetHeight;
//             const initialTop = (imageRect.height - watermarkHeight) / 2 + imageOffset.y;
//             const initialLeft = (imageRect.width - watermarkWidth) / 2 + imageOffset.x;
//             watermarkPreviewRef.current.style.top = `${initialTop}px`;
//             watermarkPreviewRef.current.style.left = `${initialLeft}px`;
//             setImage((prev) => ({
//                 ...prev,
//                 watermarkPosition: { x: initialLeft, y: initialTop },
//             }));
//             console.log("Initial Text Preview Position:", { x: initialLeft, y: initialTop, watermarkWidth, watermarkHeight });
//         }
//     };

//     const updateLogoPreview = async () => {
//         if (!logoPreviewRef.current || !previewContainerRef.current || !logoFile || !imageRef.current) return;
//         const container = previewContainerRef.current.getBoundingClientRect();
//         const imageRect = imageRef.current.getBoundingClientRect();
//         const containerWidth = imageRect.width;
//         logoPreviewRef.current.style.display = "block";
//         logoPreviewRef.current.src = URL.createObjectURL(logoFile);
//         logoPreviewRef.current.style.width = `${(containerWidth * logoSize) / 100}px`;
//         logoPreviewRef.current.style.opacity = (opacity / 100).toString();
//         logoPreviewRef.current.style.transform = `rotate(${rotation}deg)`;

//         // Set height based on actual aspect ratio
//         const aspectRatio = await getImageAspectRatio(logoFile);
//         logoPreviewRef.current.style.height = `${(containerWidth * logoSize) / 100 * aspectRatio}px`;

//         // Force reflow to get accurate dimensions
//         logoPreviewRef.current.offsetHeight; // Trigger reflow

//         if (!image.watermarkPosition.x && !image.watermarkPosition.y) {
//             const logoWidth = logoPreviewRef.current.offsetWidth;
//             const logoHeight = logoPreviewRef.current.offsetHeight;
//             const initialTop = (imageRect.height - logoHeight) / 2 + imageOffset.y;
//             const initialLeft = (imageRect.width - logoWidth) / 2 + imageOffset.x;
//             logoPreviewRef.current.style.top = `${initialTop}px`;
//             logoPreviewRef.current.style.left = `${initialLeft}px`;
//             setImage((prev) => ({
//                 ...prev,
//                 watermarkPosition: { x: initialLeft, y: initialTop },
//             }));
//             console.log("Initial Logo Preview Position:", { x: initialLeft, y: initialTop, logoWidth, logoHeight });
//         }
//     };

//     useEffect(() => {
//         if (!image || !imageRef.current || !previewContainerRef.current) return;
//         const containerRect = previewContainerRef.current.getBoundingClientRect();
//         const imageRect = imageRef.current.getBoundingClientRect();
//         setImageOffset({
//             x: imageRect.left - containerRect.left,
//             y: imageRect.top - containerRect.top,
//         });
//         console.log("Image Offset:", {
//             x: imageRect.left - containerRect.left,
//             y: imageRect.top - containerRect.top,
//             imageRect,
//             containerRect,
//         });

//         if (watermarkType === "text") {
//             updateTextPreview();
//         } else {
//             updateLogoPreview();
//         }
//         if (watermarkPreviewRef.current) {
//             watermarkPreviewRef.current.style.display =
//                 watermarkType === "text" && !showWatermarked ? "block" : "none";
//         }
//         if (logoPreviewRef.current) {
//             logoPreviewRef.current.style.display =
//                 watermarkType === "logo" && logoFile && !showWatermarked ? "block" : "none";
//         }
//     }, [
//         watermarkText,
//         textSize,
//         textColor,
//         opacity,
//         rotation,
//         logoSize,
//         watermarkType,
//         logoFile,
//         showWatermarked,
//         image,
//     ]);

//     const makeDraggable = (element) => {
//         let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

//         const dragMouseDown = (e) => {
//             e.preventDefault();
//             pos3 = e.clientX;
//             pos4 = e.clientY;
//             document.onmouseup = closeDragElement;
//             document.onmousemove = elementDrag;
//         };

//         const elementDrag = (e) => {
//             e.preventDefault();
//             pos1 = pos3 - e.clientX;
//             pos2 = pos4 - e.clientY;
//             pos3 = e.clientX;
//             pos4 = e.clientY;

//             const container = previewContainerRef.current?.getBoundingClientRect();
//             const imageRect = imageRef.current?.getBoundingClientRect();
//             const elementRect = element.getBoundingClientRect();

//             let newTop = element.offsetTop - pos2;
//             let newLeft = element.offsetLeft - pos1;

//             if (container && imageRect) {
//                 const minLeft = imageOffset.x;
//                 const minTop = imageOffset.y;
//                 const maxLeft = imageOffset.x + imageRect.width - elementRect.width;
//                 const maxTop = imageOffset.y + imageRect.height - elementRect.height;

//                 newTop = Math.max(minTop, Math.min(newTop, maxTop));
//                 newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));

//                 element.style.top = `${newTop}px`;
//                 element.style.left = `${newLeft}px`;

//                 if (image) {
//                     setImage((prev) => ({
//                         ...prev,
//                         watermarkPosition: { x: newLeft, y: newTop },
//                     }));
//                     console.log("Drag Position:", {
//                         type: watermarkType,
//                         x: newLeft,
//                         y: newTop,
//                         elementWidth: elementRect.width,
//                         elementHeight: elementRect.height,
//                         imageBounds: { width: imageRect.width, height: imageRect.height },
//                         offset: imageOffset,
//                     });
//                 }
//             }
//         };

//         const closeDragElement = () => {
//             document.onmouseup = null;
//             document.onmousemove = null;
//         };

//         element.onmousedown = dragMouseDown;
//     };

//     useEffect(() => {
//         if (watermarkPreviewRef.current) makeDraggable(watermarkPreviewRef.current);
//         if (logoPreviewRef.current) makeDraggable(logoPreviewRef.current);
//     }, [imageOffset, watermarkType, watermarkText, textSize, logoFile, logoSize]);

//     return (
//         <div className="min-h-screen bg-gray-100">
//             <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-6">
//                 <div className="container mx-auto px-4">
//                     <h1 className="text-3xl font-bold text-center">Watermark Editor</h1>
//                 </div>
//             </header>
//             <main className="container mx-auto px-4 py-8">
//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                     <div className="lg:col-span-2">
//                         <div className="bg-white shadow-lg rounded-lg overflow-hidden">
//                             <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
//                                 <h2 className="text-xl font-semibold">Image Preview</h2>
//                             </div>
//                             <div className="p-4">
//                                 <div
//                                     ref={previewContainerRef}
//                                     className="relative min-h-[300px] bg-gray-100 rounded-lg flex items-center justify-center"
//                                 >
//                                     {image ? (
//                                         <NextImage
//                                             ref={imageRef}
//                                             src={showWatermarked && image.watermarked ? image.watermarked : image.preview}
//                                             alt="Preview"
//                                             width={800}
//                                             height={600}
//                                             className="max-w-full max-h-[600px] object-contain"
//                                             style={{ width: "auto", height: "auto" }}
//                                             unoptimized // Prevent NextImage optimizations
//                                             onLoadingComplete={(img) => {
//                                                 const rect = img.getBoundingClientRect();
//                                                 setDisplayedDimensions({
//                                                     width: rect.width,
//                                                     height: rect.height,
//                                                 });
//                                                 console.log("Image Loaded Dimensions:", {
//                                                     displayed: { width: rect.width, height: rect.height },
//                                                     natural: { width: img.naturalWidth, height: img.naturalHeight },
//                                                 });
//                                             }}
//                                         />
//                                     ) : (
//                                         <p className="text-gray-500">Upload an image to start</p>
//                                     )}
//                                     <div
//                                         ref={watermarkPreviewRef}
//                                         className={`absolute ${watermarkType === "text" && image && !showWatermarked ? "block" : "hidden"} bg-black/10 p-2 cursor-move`}
//                                     ></div>
//                                     <img
//                                         ref={logoPreviewRef}
//                                         className={`absolute ${watermarkType === "logo" && image && logoFile && !showWatermarked ? "block" : "hidden"} bg-black/10 p-1 cursor-move`}
//                                         alt="Logo preview"
//                                     />
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                     <div className="space-y-6">
//                         <ImageUpload onUpload={handleImageUpload} />
//                         <WatermarkTypeSelector watermarkType={watermarkType} setWatermarkType={setWatermarkType} />
//                         {watermarkType === "text" && (
//                             <TextWatermarkSettings
//                                 watermarkText={watermarkText}
//                                 setWatermarkText={setWatermarkText}
//                                 textSize={textSize}
//                                 setTextSize={setTextSize}
//                                 textColor={textColor}
//                                 setTextColor={setTextColor}
//                             />
//                         )}
//                         {watermarkType === "logo" && (
//                             <LogoWatermarkSettings
//                                 onLogoUpload={handleLogoUpload}
//                                 logoSize={logoSize}
//                                 setLogoSize={setLogoSize}
//                             />
//                         )}
//                         <WatermarkSettings
//                             image={image}
//                             opacity={opacity}
//                             setOpacity={setOpacity}
//                             rotation={rotation}
//                             setRotation={setRotation}
//                             onApply={handleApplyWatermark}
//                             onDownload={handleDownload}
//                         />
//                     </div>
//                 </div>
//             </main>
//             {message && (
//                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
//                     <div className="bg-white rounded-lg p-6 max-w-md w-full">
//                         <h3 className="text-lg font-semibold">{message.title}</h3>
//                         <p className="mt-2 text-gray-600">{message.text}</p>
//                         <button
//                             onClick={() => setMessage(null)}
//                             className="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded-full hover:bg-gray-300 transition"
//                         >
//                             Close
//                         </button>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }





"use client";
import { useState, useRef, useEffect } from "react";
import NextImage from "next/image";
import ImageUpload from "../components/ImageUpload";
import WatermarkTypeSelector from "../components/WatermarkTypeSelector";
import TextWatermarkSettings from "../components/TextwatermarkSettings";
import LogoWatermarkSettings from "../components/LogoWatermarkSettings";
import WatermarkSettings from "../components/WatermarkSettings";

export default function Editor() {
    const [image, setImage] = useState(null);
    const [watermarkType, setWatermarkType] = useState("text");
    const [watermarkText, setWatermarkText] = useState("Your Watermark");
    const [textSize, setTextSize] = useState(30);
    const [textColor, setTextColor] = useState("#ffffff");
    const [logoFile, setLogoFile] = useState(null);
    const [logoSize, setLogoSize] = useState(30);
    const [opacity, setOpacity] = useState(50);
    const [rotation, setRotation] = useState(0);
    const [message, setMessage] = useState(null);
    const [showWatermarked, setShowWatermarked] = useState(false);
    const previewContainerRef = useRef(null);
    const watermarkPreviewRef = useRef(null);
    const logoPreviewRef = useRef(null);
    const imageRef = useRef(null);
    const [displayedDimensions, setDisplayedDimensions] = useState({ width: 0, height: 0 });
    const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });

    const handleImageUpload = (file) => {
        const img = new window.Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            setImage({
                id: crypto.randomUUID(),
                file,
                preview: img.src,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                watermarkPosition: { x: 0, y: 0 },
            });
            setShowWatermarked(false);
        };
    };

    const handleLogoUpload = (file) => {
        setLogoFile(file);
        updateLogoPreview();
    };

    const handleApplyWatermark = async () => {
        if (!image) {
            setMessage({ title: "Error", text: "Please upload an image first." });
            return;
        }
        if (watermarkType === "logo" && !logoFile) {
            setMessage({ title: "Error", text: "Please upload a logo first." });
            return;
        }

        const imageElement = imageRef.current;
        if (!imageElement) {
            setMessage({ title: "Error", text: "Image element not found." });
            return;
        }

        const { width: displayedWidth, height: displayedHeight } = displayedDimensions;
        if (displayedWidth <= 0 || displayedHeight <= 0) {
            setMessage({ title: "Error", text: "Image dimensions not loaded." });
            return;
        }

        // Calculate server-side resized dimensions (same as API)
        const maxHeight = 600;
        const aspectRatio = image.naturalWidth / image.naturalHeight;
        let resizedWidth, resizedHeight;
        if (image.naturalHeight > maxHeight) {
            resizedHeight = maxHeight;
            resizedWidth = Math.round(maxHeight * aspectRatio);
        } else {
            resizedHeight = image.naturalHeight;
            resizedWidth = image.naturalWidth;
        }

        // Get watermark dimensions (aligned with server)
        let watermarkWidth, watermarkHeight;
        if (watermarkType === "text") {
            const fontSize = textSize;
            watermarkWidth = Math.min(watermarkText.length * fontSize * 0.75, resizedWidth * 0.8); // Adjusted to match sharp's Arial metrics
            watermarkHeight = fontSize * 1.5;
        } else {
            watermarkWidth = (resizedWidth * logoSize) / 100;
            watermarkHeight = watermarkWidth * (logoFile ? (await getImageAspectRatio(logoFile)) : 0.5714);
        }

        // Adjust drag coordinates to be relative to the image's top-left corner
        let adjustedX = image.watermarkPosition.x - imageOffset.x;
        let adjustedY = image.watermarkPosition.y - imageOffset.y;

        // Scale coordinates to resized image dimensions
        const scaleX = resizedWidth / displayedWidth;
        const scaleY = resizedHeight / displayedHeight;
        let scaledX = adjustedX * scaleX;
        let scaledY = adjustedY * scaleY;

        // Clamp coordinates to ensure watermark stays within bounds
        scaledX = Math.max(0, Math.min(scaledX, resizedWidth - watermarkWidth));
        scaledY = Math.max(0, Math.min(scaledY, resizedHeight - watermarkHeight));

        console.log("Apply Watermark Debug:", {
            displayed: { width: displayedWidth, height: displayedHeight },
            natural: { width: image.naturalWidth, height: image.naturalHeight },
            resized: { width: resizedWidth, height: resizedHeight },
            watermark: { width: watermarkWidth, height: watermarkHeight },
            dragPosition: { x: image.watermarkPosition.x, y: image.watermarkPosition.y },
            imageOffset: { x: imageOffset.x, y: imageOffset.y },
            adjustedPosition: { x: adjustedX, y: adjustedY },
            scale: { x: scaleX, y: scaleY },
            scaledPosition: { x: scaledX, y: scaledY },
        });

        const formData = new FormData();
        formData.append("image", image.file);
        if (logoFile) formData.append("logo", logoFile);
        formData.append("watermark_type", watermarkType);
        formData.append("watermark_text", watermarkText);
        formData.append("watermark_x", Math.round(scaledX).toString());
        formData.append("watermark_y", Math.round(scaledY).toString());
        formData.append("watermark_opacity", (opacity / 100).toString());
        formData.append("watermark_size", (watermarkType === "text" ? textSize : logoSize).toString());
        formData.append("watermark_color", textColor);
        formData.append("rotation_angle", rotation.toString());

        try {
            const response = await fetch("/api/watermark", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            console.log("API Response:", data);
            if (data.success) {
                setImage((prev) => ({ ...prev, watermarked: data.image_data }));
                if (watermarkPreviewRef.current) watermarkPreviewRef.current.style.display = "none";
                if (logoPreviewRef.current) logoPreviewRef.current.style.display = "none";
                setShowWatermarked(true);
                setMessage({ title: "Success", text: "Watermark applied successfully!" });
            } else {
                setMessage({ title: "Error", text: data.error || "Failed to apply watermark." });
            }
        } catch (error) {
            setMessage({ title: "Error", text: "An error occurred while applying the watermark." });
        }
    };

    const handleDownload = () => {
        if (!image?.watermarked) {
            setMessage({ title: "Error", text: "No watermarked image available for download." });
            return;
        }
        const link = document.createElement("a");
        link.href = image.watermarked;
        link.download = `watermarked_${image.file.name}`;
        link.click();
    };

    const getImageAspectRatio = async (file) => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                resolve(img.naturalHeight / img.naturalWidth);
            };
        });
    };

    const updateTextPreview = () => {
        if (!watermarkPreviewRef.current || !previewContainerRef.current || !imageRef.current) return;
        const container = previewContainerRef.current.getBoundingClientRect();
        const imageRect = imageRef.current.getBoundingClientRect();
        watermarkPreviewRef.current.style.display = "block";
        watermarkPreviewRef.current.style.fontSize = `${textSize}px`;
        watermarkPreviewRef.current.style.color = textColor;
        watermarkPreviewRef.current.style.opacity = (opacity / 100).toString();
        watermarkPreviewRef.current.style.transform = `rotate(${rotation}deg)`;
        watermarkPreviewRef.current.textContent = watermarkText;

        // Match server-side dimensions
        watermarkPreviewRef.current.style.width = `${watermarkText.length * textSize * 0.75}px`; // Adjusted to match sharp's Arial metrics
        watermarkPreviewRef.current.style.height = `${textSize * 1.5}px`;

        // Force reflow to get accurate dimensions
        watermarkPreviewRef.current.offsetHeight;

        if (!image.watermarkPosition.x && !image.watermarkPosition.y) {
            const watermarkWidth = watermarkPreviewRef.current.offsetWidth;
            const watermarkHeight = watermarkPreviewRef.current.offsetHeight;
            const initialTop = (imageRect.height - watermarkHeight) / 2 + imageOffset.y;
            const initialLeft = (imageRect.width - watermarkWidth) / 2 + imageOffset.x;
            watermarkPreviewRef.current.style.top = `${initialTop}px`;
            watermarkPreviewRef.current.style.left = `${initialLeft}px`;
            setImage((prev) => ({
                ...prev,
                watermarkPosition: { x: initialLeft, y: initialTop },
            }));
            console.log("Initial Text Preview Position:", { x: initialLeft, y: initialTop, watermarkWidth, watermarkHeight });
        }
    };

    const updateLogoPreview = async () => {
        if (!logoPreviewRef.current || !previewContainerRef.current || !logoFile || !imageRef.current) return;
        const container = previewContainerRef.current.getBoundingClientRect();
        const imageRect = imageRef.current.getBoundingClientRect();
        const containerWidth = imageRect.width;
        logoPreviewRef.current.style.display = "block";
        logoPreviewRef.current.src = URL.createObjectURL(logoFile);
        logoPreviewRef.current.style.width = `${(containerWidth * logoSize) / 100}px`;
        logoPreviewRef.current.style.opacity = (opacity / 100).toString();
        logoPreviewRef.current.style.transform = `rotate(${rotation}deg)`;

        const aspectRatio = await getImageAspectRatio(logoFile);
        logoPreviewRef.current.style.height = `${(containerWidth * logoSize) / 100 * aspectRatio}px`;

        logoPreviewRef.current.offsetHeight;

        if (!image.watermarkPosition.x && !image.watermarkPosition.y) {
            const logoWidth = logoPreviewRef.current.offsetWidth;
            const logoHeight = logoPreviewRef.current.offsetHeight;
            const initialTop = (imageRect.height - logoHeight) / 2 + imageOffset.y;
            const initialLeft = (imageRect.width - logoWidth) / 2 + imageOffset.x;
            logoPreviewRef.current.style.top = `${initialTop}px`;
            logoPreviewRef.current.style.left = `${initialLeft}px`;
            setImage((prev) => ({
                ...prev,
                watermarkPosition: { x: initialLeft, y: initialTop },
            }));
            console.log("Initial Logo Preview Position:", { x: initialLeft, y: initialTop, logoWidth, logoHeight });
        }
    };

    useEffect(() => {
        if (!image || !imageRef.current || !previewContainerRef.current) return;
        const containerRect = previewContainerRef.current.getBoundingClientRect();
        const imageRect = imageRef.current.getBoundingClientRect();
        setImageOffset({
            x: imageRect.left - containerRect.left,
            y: imageRect.top - containerRect.top,
        });
        console.log("Image Offset:", {
            x: imageRect.left - containerRect.left,
            y: imageRect.top - containerRect.top,
            imageRect,
            containerRect,
        });

        if (watermarkType === "text") {
            updateTextPreview();
        } else {
            updateLogoPreview();
        }
        if (watermarkPreviewRef.current) {
            watermarkPreviewRef.current.style.display =
                watermarkType === "text" && !showWatermarked ? "block" : "none";
        }
        if (logoPreviewRef.current) {
            logoPreviewRef.current.style.display =
                watermarkType === "logo" && logoFile && !showWatermarked ? "block" : "none";
        }
    }, [
        watermarkText,
        textSize,
        textColor,
        opacity,
        rotation,
        logoSize,
        watermarkType,
        logoFile,
        showWatermarked,
        image,
    ]);

    const makeDraggable = (element) => {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        const dragMouseDown = (e) => {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        };

        const elementDrag = (e) => {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            const container = previewContainerRef.current?.getBoundingClientRect();
            const imageRect = imageRef.current?.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();

            let newTop = element.offsetTop - pos2;
            let newLeft = element.offsetLeft - pos1;

            if (container && imageRect) {
                const minLeft = imageOffset.x;
                const minTop = imageOffset.y;
                const maxLeft = imageOffset.x + imageRect.width - elementRect.width;
                const maxTop = imageOffset.y + imageRect.height - elementRect.height;

                newTop = Math.max(minTop, Math.min(newTop, maxTop));
                newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));

                element.style.top = `${newTop}px`;
                element.style.left = `${newLeft}px`;

                if (image) {
                    setImage((prev) => ({
                        ...prev,
                        watermarkPosition: { x: newLeft, y: newTop },
                    }));
                    console.log("Drag Position:", {
                        type: watermarkType,
                        x: newLeft,
                        y: newTop,
                        elementWidth: elementRect.width,
                        elementHeight: elementRect.height,
                        imageBounds: { width: imageRect.width, height: imageRect.height },
                        offset: imageOffset,
                    });
                }
            }
        };

        const closeDragElement = () => {
            document.onmouseup = null;
            document.onmousemove = null;
        };

        element.onmousedown = dragMouseDown;
    };

    useEffect(() => {
        if (watermarkPreviewRef.current) makeDraggable(watermarkPreviewRef.current);
        if (logoPreviewRef.current) makeDraggable(logoPreviewRef.current);
    }, [imageOffset, watermarkType, watermarkText, textSize, logoFile, logoSize]);

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-6">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold text-center">Watermark Editor</h1>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
                                <h2 className="text-xl font-semibold">Image Preview</h2>
                            </div>
                            <div className="p-4">
                                <div
                                    ref={previewContainerRef}
                                    className="relative min-h-[300px] bg-gray-100 rounded-lg flex items-center justify-center"
                                >
                                    {image ? (
                                        <NextImage
                                            ref={imageRef}
                                            src={showWatermarked && image.watermarked ? image.watermarked : image.preview}
                                            alt="Preview"
                                            width={800}
                                            height={600}
                                            className="max-w-full max-h-[600px] object-contain"
                                            style={{ width: "auto", height: "auto" }}
                                            unoptimized
                                            onLoadingComplete={(img) => {
                                                const rect = img.getBoundingClientRect();
                                                setDisplayedDimensions({
                                                    width: rect.width,
                                                    height: rect.height,
                                                });
                                                console.log("Image Loaded Dimensions:", {
                                                    displayed: { width: rect.width, height: rect.height },
                                                    natural: { width: img.naturalWidth, height: img.naturalHeight },
                                                });
                                            }}
                                        />
                                    ) : (
                                        <p className="text-gray-500">Upload an image to start</p>
                                    )}
                                    <div
                                        ref={watermarkPreviewRef}
                                        className={`absolute ${watermarkType === "text" && image && !showWatermarked ? "block" : "hidden"} bg-black/10 p-2 cursor-move`}
                                    ></div>
                                    <img
                                        ref={logoPreviewRef}
                                        className={`absolute ${watermarkType === "logo" && image && logoFile && !showWatermarked ? "block" : "hidden"} bg-black/10 p-1 cursor-move`}
                                        alt="Logo preview"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <ImageUpload onUpload={handleImageUpload} />
                        <WatermarkTypeSelector watermarkType={watermarkType} setWatermarkType={setWatermarkType} />
                        {watermarkType === "text" && (
                            <TextWatermarkSettings
                                watermarkText={watermarkText}
                                setWatermarkText={setWatermarkText}
                                textSize={textSize}
                                setTextSize={setTextSize}
                                textColor={textColor}
                                setTextColor={setTextColor}
                            />
                        )}
                        {watermarkType === "logo" && (
                            <LogoWatermarkSettings
                                onLogoUpload={handleLogoUpload}
                                logoSize={logoSize}
                                setLogoSize={setLogoSize}
                            />
                        )}
                        <WatermarkSettings
                            image={image}
                            opacity={opacity}
                            setOpacity={setOpacity}
                            rotation={rotation}
                            setRotation={setRotation}
                            onApply={handleApplyWatermark}
                            onDownload={handleDownload}
                        />
                    </div>
                </div>
            </main>
            {message && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold">{message.title}</h3>
                        <p className="mt-2 text-gray-600">{message.text}</p>
                        <button
                            onClick={() => setMessage(null)}
                            className="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded-full hover:bg-gray-300 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}