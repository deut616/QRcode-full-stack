import React, { useState, useEffect } from "react";

// --- Types & Interfaces ---
// This is the "Contract". It ensures your React data matches 
// exactly what your Python script (Pillow/QRCode) expects.
interface QRConfig {
  text: string;
  size: number | "";   // Allows empty string while user is typing
  color: string;
  background: string;
  margin: number | "";
}

interface AppStatus {
  loading: boolean;
  qrUrl: string | null;
  error: string | null;
}

export default function App() {
  // 1. Initialize state with our TypeScript interface
  const [config, setConfig] = useState<QRConfig>({
    text: "https://example.com",
    size: 300,
    color: "#000000",
    background: "#ffffff",
    margin: 4,
  });

  const [status, setStatus] = useState<AppStatus>({ 
    loading: false, 
    qrUrl: null, 
    error: null 
  });

  // 2. Memory Management (The "Pro" Touch)
  // When we generate a new QR, we delete the old one from the browser's 
  // memory so the app stays fast.
  useEffect(() => {
    return () => {
      if (status.qrUrl) URL.revokeObjectURL(status.qrUrl);
    };
  }, [status.qrUrl]);

  // 3. Human-Friendly Input Handling
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      // Allow the user to delete the number without it snapping back to 0
      if (value === "") {
        setConfig(prev => ({ ...prev, [name]: "" }));
        return;
      }
      const num = parseInt(value, 10);
      if (!isNaN(num)) setConfig(prev => ({ ...prev, [name]: num }));
    } else {
      setConfig(prev => ({ ...prev, [name]: value }));
    }
  };

  // 4. The API Bridge
  const generateQRCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!config.text.trim()) {
      setStatus(prev => ({ ...prev, error: "Please enter some content first." }));
      return;
    }

    setStatus({ loading: true, error: null, qrUrl: null });

    try {
      // This sends your config object to your Python backend
      const response = await fetch("/api/qrcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error("Server error. Is the Python backend running?");

      const imageBlob = await response.blob();
      setStatus({ 
        loading: false, 
        qrUrl: URL.createObjectURL(imageBlob), 
        error: null 
      });
    } catch (err) {
      setStatus({ 
        loading: false, 
        qrUrl: null, 
        error: err instanceof Error ? err.message : "Something went wrong." 
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 text-slate-900 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tight mb-2">QR Studio Pro</h1>
          <p className="text-slate-500">TypeScript + Python Image Processing</p>
        </header>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Controls */}
          <form onSubmit={generateQRCode} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-600">Content</label>
              <textarea
                name="text"
                value={config.text}
                onChange={handleInputChange}
                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-600">Size (px)</label>
                <input name="size" type="number" value={config.size} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-600">Margin</label>
                <input name="margin" type="number" value={config.margin} onChange={handleInputChange} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 flex justify-around border border-slate-200">
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Foreground</span>
                <input name="color" type="color" value={config.color} onChange={handleInputChange} className="w-10 h-10 cursor-pointer" />
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Background</span>
                <input name="background" type="color" value={config.background} onChange={handleInputChange} className="w-10 h-10 cursor-pointer" />
              </div>
            </div>

            <button
              disabled={status.loading}
              className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {status.loading ? "Generating..." : "Generate QR Code"}
            </button>
          </form>

          {/* Preview */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[400px]">
            {status.error && <p className="text-red-500 text-sm mb-4">{status.error}</p>}
            
            {status.qrUrl ? (
              <div className="text-center animate-in fade-in zoom-in duration-300">
                <img 
                  src={status.qrUrl} 
                  alt="QR Code" 
                  className="max-w-xs w-full rounded-lg shadow-lg mb-6" 
                  style={{ backgroundColor: config.background }}
                />
                <a 
                  href={status.qrUrl} 
                  download="qrcode.png"
                  className="text-blue-600 font-bold hover:underline"
                >
                  Download PNG →
                </a>
              </div>
            ) : (
              <p className="text-slate-400 font-medium">Ready for generation</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}