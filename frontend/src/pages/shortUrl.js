import { useState } from "react";
import axios from "axios";
import "./modern.css";

export default function UrlShortener({ uid }) {
  const [longUrl, setLongUrl] = useState("");
  const [shortenedUrls, setShortenedUrls] = useState([]);
  const [error, setError] = useState("");

  const isValidUrl = (url) => {
    const regex = /^(https?:\/\/)?([a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}|localhost)(:[0-9]{1,5})?(\/.*)?$/i;
    return regex.test(url);
  };

  const generateShortUrl = async () => {
    if (!longUrl.trim()) {
      setError("Please enter a URL.");
      return;
    }
    if (!isValidUrl(longUrl)) {
      setError("Invalid URL format. Please check and try again.");
      return;
    }

    setError(""); // Clear any previous errors

    try {
      const response = await axios.post("https://link-shrinker-backend.onrender.com/api/urls/shorten", {
  originalUrl: longUrl.startsWith("http") ? longUrl : `https://${longUrl}`,
  createdBy: uid || "guest", // fallback for unauthenticated users
});


      setShortenedUrls((prev) => [
        ...prev,
        { originalUrl: longUrl, shortUrl: response.data.shortUrl },
      ]);
      setLongUrl(""); // Clear input
    } catch (err) {
      console.error(err);
      setError("Failed to shorten URL. Please try again.");
    }
  };

  return (
    <div className="shortener-container">
      <div className="shortener-box">
        <h2 className="shortener-title">Shrink URL</h2>

        <input
          type="text"
          placeholder="Enter long URL"
          value={longUrl}
          onChange={(e) => setLongUrl(e.target.value)}
          className="shortener-input"
        />
        <button onClick={generateShortUrl} className="shortener-button">
          Shrink URL
        </button>

        {error && <p className="error-message">{error}</p>}

        {shortenedUrls.length > 0 && (
          <div className="short-url-container">
            <p>Shortened Links:</p>
            {shortenedUrls.map(({ shortUrl }, index) => (
              <div key={index}>
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="short-url"
                >
                  {shortUrl}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}