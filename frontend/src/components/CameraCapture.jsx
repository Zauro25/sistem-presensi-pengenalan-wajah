import React, { useRef, useEffect } from "react";

export default function CameraCapture({ onCapture, active }) {
  const videoRef = useRef();
  const canvasRef = useRef();
  const animationRef = useRef();
  const streamRef = useRef();

  useEffect(() => {
    if (active) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [active]);

  const startCamera = async () => {
    try {
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      console.log("Camera access granted");
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log("Camera started successfully");
        loopDetect();
      }
    } catch (e) {
      console.error("Camera error:", e);
      let errorMsg = "Gagal mengakses kamera";
      if (e.name === "NotAllowedError") {
        errorMsg = "Izin kamera ditolak. Silakan berikan izin kamera di browser.";
      } else if (e.name === "NotFoundError") {
        errorMsg = "Kamera tidak ditemukan pada perangkat ini.";
      } else if (e.name === "NotReadableError") {
        errorMsg = "Kamera sedang digunakan aplikasi lain.";
      }
      alert(errorMsg);
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

  const loopDetect = async () => {
    const res = await captureFrame();
    animationRef.current = requestAnimationFrame(loopDetect);
    drawBox(res);
  };

  const captureFrame = async () => {
    if (!videoRef.current) {
      console.log("Video element not ready");
      return null;
    }
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log("Video dimensions not ready");
      return null;
    }
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tctx = tempCanvas.getContext("2d");
    tctx.translate(video.videoWidth, 0);
    tctx.scale(-1, 1);
    tctx.drawImage(video, 0, 0);
    const dataURL = tempCanvas.toDataURL("image/jpeg");
    const res = await onCapture(dataURL);
    return res;
  };

  const drawBox = (res) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !res?.location || !video) return;

    const ctx = canvas.getContext("2d");
    const { top, right, bottom, left } = res.location;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const displayWidth = video.clientWidth;
    const displayHeight = video.clientHeight;

    const scaleX = displayWidth / videoWidth;
    const scaleY = displayHeight / videoHeight;

    const boxWidth = (right - left) * scaleX;
    const boxHeight = (bottom - top) * scaleY;
    const scaledLeft = left * scaleX;
    const scaledTop = top * scaleY;

    canvas.width = displayWidth;
    canvas.height = displayHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "lime";
    ctx.lineWidth = 3;
    ctx.strokeRect(scaledLeft, scaledTop, boxWidth, boxHeight);

    const label =
      res.santri?.nama && res.status
        ? `${res.santri.nama} (${res.status})`
        : res.santri?.nama || "";

    ctx.fillStyle = "lime";
    ctx.font = "16px Arial";
    ctx.fillText(label, scaledLeft + 4, scaledTop - 10);
  };


  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <video
        ref={videoRef}
        style={{
          width: "100%",
          maxWidth: "480px",
          borderRadius: "10px",
          transform: "scaleX(-1)"
        }}
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
    </div>
  );
}
