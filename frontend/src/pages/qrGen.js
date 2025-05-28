import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import "./modern.css";

export default function QRCodeGenerator() {
  const [url, setUrl] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [error, setError] = useState("");  // New state for error handling

  // Function to validate URL format
  const validateUrl = (inputUrl) => {
    const regex = /^(ftp|http|https):\/\/[^ "]+$/;
    return regex.test(inputUrl);
  };

  const generateQRCode = () => {
    if (url.trim() === "") {
      setError("Please enter a URL.");
    } else if (!validateUrl(url)) {
      setError("Invalid URL. Please enter a valid URL.");
    } else {
      setError(""); // Reset error
      setQrValue(url);
    }
  };

  const clearQRCode = () => {
    setUrl("");
    setQrValue("");
    setError("");  // Reset error when clearing
  };

  return (
    <div className="qr-container">
      <div className="qr-box">
        <h2 className="qr-title">QR Code Generator</h2>
        <input
          type="text"
          placeholder="Enter website URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="qr-input"
        />
        <button onClick={generateQRCode} className="qr-button">
          Generate QR Code
        </button>

        {/* Show error message if URL is invalid or empty */}
        {error && <p className="error-message">{error}</p>}

        {qrValue && (
          <div className="qr-result">
            <QRCodeCanvas value={qrValue} size={200} />
            <button onClick={clearQRCode} className="clear-button">
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
