export default function WatermarkSettings({
    image,
    opacity,
    setOpacity,
    rotation,
    setRotation,
    onApply,
    onDownload,
}) {
    return (
        <div className="bg-white shadow-lg rounded-lg">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-lg">
                <h2 className="text-xl font-semibold">Watermark Settings</h2>
            </div>
            <div className="p-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Opacity: {opacity}%</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={opacity}
                        onChange={(e) => setOpacity(Number(e.target.value))}
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Rotation: {rotation}°</label>
                    <input
                        type="range"
                        min="0"
                        max="359"
                        value={rotation}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="w-full"
                    />
                </div>
                <button
                    onClick={onApply}
                    className="w-full bg-purple-600 text-white py-2 rounded-full hover:bg-purple-700 transition"
                >
                    Apply Watermark
                </button>
                {image?.watermarked && (
                    <button
                        onClick={onDownload}
                        className="w-full bg-gray-800 text-white py-2 rounded-full hover:bg-gray-900 transition"
                    >
                        Download
                    </button>
                )}
            </div>
        </div>
    );
}