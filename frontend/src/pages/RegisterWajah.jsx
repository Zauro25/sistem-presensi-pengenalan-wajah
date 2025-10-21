import React, { useRef, useEffect, useState } from "react";

export default function RegisterWajah() {
  const [mode, setMode] = useState("idle");
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);
  const [isRegistered, setIsRegistered] = useState(false)

  useEffect(() => {
    if (mode === "kamera") startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [mode]);

  const startCamera = async () => {
    try {
      await new Promise((r) => setTimeout(r, 300));
      const videoEl = videoRef.current;

      if (!videoEl) {
        setMsg("Video element belum siap.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      videoEl.srcObject = stream;
      await videoEl.play();

      setMsg("🎥 Kamera aktif — sistem sedang memantau wajah...");
      detectLoop();
    } catch (err) {
      console.error("Gagal akses kamera:", err);
      setMsg("Gagal akses kamera, cek permission di browser.");
    }
  };

  const stopCamera = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  // Looping real-time pakai requestAnimationFrame
  const detectLoop = async () => {
    await captureAndSend();
    animationRef.current = requestAnimationFrame(detectLoop);
  };

  const captureAndSend = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const userData = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    const santriId = userData?.santri_id || userData?.id;


    if (!userData || !userData.santri_id) {
      console.warn("Data santri belum lengkap:", userData);
      setMsg("Data santri tidak ditemukan di localStorage.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL("image/jpeg");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/santri/registrasi-wajah/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Token " + token,
        },
        body: JSON.stringify({ santri_id: santriId, image: dataURL }),
      });

      const data = await res.json();
      console.log("DEBUG >> response:", data);

      if (res.ok && data.location) {
        drawBox(data.location, data.nama, data.sektor);
        setMsg(`✅ Wajah ${data.nama} berhasil diregistrasi!`);
        return;
      } else {
        setMsg("🔍 Mendeteksi wajah...");
      }
    } catch (err) {
      console.error("Error koneksi:", err);
      setMsg("Error koneksi ke server.");
    }
  };

  const drawBox = (location, nama, sektor) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !location) return;

    const ctx = canvas.getContext("2d");

    // ukuran asli video dari kamera
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // ukuran tampilan di layar
    const displayWidth = video.clientWidth;
    const displayHeight = video.clientHeight;

    const scaleX = displayWidth / videoWidth;
    const scaleY = displayHeight / videoHeight;

    const { top, right, bottom, left } = location;

    const scaledLeft = left * scaleX;
    const scaledTop = top * scaleY;
    const scaledWidth = (right - left) * scaleX;
    const scaledHeight = (bottom - top) * scaleY;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 3;
    ctx.strokeRect(scaledLeft, scaledTop, scaledWidth, scaledHeight);

    ctx.fillStyle = "lime";
    ctx.font = "16px Arial";
    ctx.fillText(`${nama} - ${sektor}`, scaledLeft + 5, scaledTop - 10);
  };

  const uploadManual = async (e) => {
    e.preventDefault();
    if (!file) {
      setMsg("Pilih file foto dulu!");
      return;
    }

    const userData = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    const santriId = userData?.santri_id;

    const formData = new FormData();
    formData.append("santri_id", santriId);
    formData.append("foto", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/santri/upload-foto/", {
        method: "POST",
        headers: { Authorization: "Token " + token },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMsg("Foto berhasil diupload & wajah terdeteksi!");
      } else {
        setMsg("Error " + (data.error || data.message));
      }
    } catch (err) {
      setMsg("Error koneksi: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-300 rounded-3xl shadow-lg p-6 w-[90%] max-w-4xl flex flex-col items-center">
        <h3 className="text-gray-800 mb-6 font-bold text-2xl">
          Registrasi Wajah Santri
        </h3>

        <div className="flex gap-4 mb-4">
          {mode !== "kamera" ? (
            <button
              onClick={() => setMode("kamera")}
              className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-lg font-bold active:scale-95 transition-transform"
            >
              🎥 Gunakan Kamera
            </button>
          ) : (
            <button
              onClick={() => setMode("idle")}
              className="bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-lg font-bold active:scale-95 transition-transform"
            >
              Matikan Kamera
            </button>
          )}

          <button
            onClick={() => setMode("upload")}
            className={`px-6 py-3 rounded-lg font-bold ${
              mode === "upload"
                ? "bg-blue-700 text-white"
                : "bg-gray-500 text-white"
            }`}
          >
            📁 Upload Manual
          </button>
        </div>

        {mode === "kamera" && (
          <div style={{ position: "relative" }}>
            <video
              ref={videoRef}
              style={{ width: "100%", maxWidth: "480px", borderRadius: "10px", transform: "scaleX(-1)" }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
              }}
            />
            <p className="text-gray-700 font-semibold mt-3">
              Kamera aktif — sistem akan otomatis deteksi & simpan wajahmu
            </p>
          </div>
        )}

        {mode === "upload" && (
          <form onSubmit={uploadManual} className="mt-4 flex flex-col items-center">
            <input
              type="file"
              accept="image/*"
              className="mb-3"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <button className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-bold active:scale-95 transition-transform">
              Upload Foto
            </button>
          </form>
        )}

        {msg && (
          <div className="mt-4 font-semibold text-gray-800 text-center">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
