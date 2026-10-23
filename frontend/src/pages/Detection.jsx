import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Sparkles,
  Scan,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Save,
  HelpCircle,
  FileImage,
  RefreshCw,
  Cpu,
  Layers
} from 'lucide-react';
import { api, getUploadUrl } from '../services/api';
import DuplicateModal from '../components/DuplicateModal';

export default function Detection() {
  const navigate = useNavigate();

  // File and preview
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activePreset, setActivePreset] = useState(null);

  // Detection states
  const [detecting, setDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [error, setError] = useState('');

  // Save to database form states
  const [latitude, setLatitude] = useState('18.5314');
  const [longitude, setLongitude] = useState('73.8446');
  const [customDescription, setCustomDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Duplicate detection state
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Handle local file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Selected image exceeds the 10 MB size limit.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    setError('');
    setSelectedFile(file);
    setActivePreset(null);
    setDetectionResult(null);
    setSaveSuccess('');

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Quick preset selector for evaluation / testing
  const handleSelectPreset = async (presetKey) => {
    setError('');
    setDetectionResult(null);
    setActivePreset(presetKey);
    setSelectedFile(null);
    setSaveSuccess('');

    // Set demo image preview
    const demoImages = {
      pothole: getUploadUrl('/uploads/demo_pothole_1.jpg'),
      manhole: getUploadUrl('/uploads/demo_manhole_1.jpg'),
      crack: getUploadUrl('/uploads/demo_crack_1.jpg'),
      dumping: getUploadUrl('/uploads/demo_dumping_1.jpg'),
    };
    setPreviewUrl(demoImages[presetKey]);

    // Automatically trigger detection for the preset
    try {
      setDetecting(true);
      const formData = new FormData();
      formData.append('preset', presetKey);

      const res = await api.detectImage(formData);
      setDetectionResult(res);
      setCustomDescription(
        `AI/CV Detection: ${res.category} detected (${res.detection_source}) with ${Math.round(res.confidence * 100)}% confidence.`
      );
    } catch (err) {
      setError(err.message || 'Detection failed for requested preset.');
    } finally {
      setDetecting(false);
    }
  };

  // Run detection on uploaded file
  const handleRunDetection = async () => {
    if (!selectedFile) {
      setError('Please upload an image before running hazard detection.');
      return;
    }

    try {
      setDetecting(true);
      setError('');
      setDetectionResult(null);
      setSaveSuccess('');

      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await api.detectImage(formData);
      setDetectionResult(res);
      setCustomDescription(
        `AI/CV Detection: ${res.category} detected (${res.detection_source}) with ${Math.round(res.confidence * 100)}% confidence.`
      );
    } catch (err) {
      setError(err.message || 'Image detection processing failed.');
    } finally {
      setDetecting(false);
    }
  };

  // Browser Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
      },
      (err) => {
        alert(`Location permission denied or unavailable: ${err.message}`);
      }
    );
  };

  // Save detected hazard into SQLite database
  const handleSaveHazard = async (force = false) => {
    if (!detectionResult) return;

    try {
      setSaving(true);
      setError('');
      setSaveSuccess('');

      const payload = {
        category: detectionResult.category,
        severity: detectionResult.severity,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        description: customDescription,
        status: 'Detected',
        detection_source: detectionResult.detection_source,
        confidence: detectionResult.confidence,
        image_path: detectionResult.image_path,
        is_demo: detectionResult.is_demo || 0,
        force: force,
      };

      const res = await api.createHazard(payload);
      if (res.success) {
        setDuplicateWarning(null);
        setSaveSuccess(`Hazard #${res.hazard.id} successfully saved to SQLite registry!`);
        setTimeout(() => {
          navigate('/hazards');
        }, 1500);
      }
    } catch (err) {
      if (err.status === 409 && err.data?.duplicate_detected) {
        // Trigger duplicate detection dialog
        setDuplicateWarning(err.data);
      } else {
        setError(err.message || 'Failed to save hazard to database.');
      }
    } finally {
      setSaving(false);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'Critical':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Title & Transparency Notice */}
      <div className="bg-[#1c2541] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <Scan className="w-6 h-6 text-cyan-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">
            AI Road Hazard Detection Studio
          </h1>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Upload road imagery or select sample evaluation scenarios to identify surface defects, potholes, cracks, and open manholes.
        </p>

        {/* Academic Integrity Notice Box */}
        <div className="p-3.5 mt-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-[11px] text-slate-400 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200">System Transparency Policy:</strong> All results are explicitly tagged as either <strong className="text-cyan-400">Actual AI Inference</strong> (when trained ONNX weights are loaded) or <strong className="text-amber-400">Demonstration Mode</strong> (using OpenCV feature analysis and illustrative evaluation presets). No synthetic predictions are misrepresented as deep neural inference.
          </div>
        </div>
      </div>

      {/* Preset Evaluation Scenarios */}
      <div className="bg-[#1c2541] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Rapid Demonstration Presets (For College Project Evaluation)
          </span>
          <span className="text-[11px] text-cyan-400 font-mono">1-Click Test Scenarios</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'pothole', label: 'Sample Pothole', category: 'Pothole', color: 'hover:border-cyan-500' },
            { id: 'manhole', label: 'Open Manhole', category: 'Open Manhole', color: 'hover:border-rose-500' },
            { id: 'crack', label: 'Road Crack', category: 'Road Crack', color: 'hover:border-amber-500' },
            { id: 'dumping', label: 'Illegal Dumping', category: 'Illegal Dumping', color: 'hover:border-teal-500' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectPreset(item.id)}
              disabled={detecting}
              className={`p-3 rounded-xl border text-left transition ${
                activePreset === item.id
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              } ${item.color}`}
            >
              <div className="text-xs font-bold text-white">{item.label}</div>
              <div className="text-[10px] text-slate-400 mt-1">Class: {item.category}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Upload and Detection Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Image Uploader & Preview */}
        <div className="bg-[#1c2541] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FileImage className="w-4 h-4 text-cyan-400" />
              Road Imagery Input
            </h2>

            {/* Drag & Drop Upload Area */}
            <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/70 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-900/60 hover:bg-slate-900 transition text-center group">
              <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-cyan-400 transition mb-2" />
              <span className="text-xs font-semibold text-white">
                Choose road photo or drag & drop here
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                Supports JPG, PNG, WEBP (Max 10MB)
              </span>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Preview Box */}
            {previewUrl && (
              <div className="mt-4 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 relative">
                <img
                  src={previewUrl}
                  alt="Road Preview"
                  className="w-full h-56 object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-slate-950/80 text-[10px] text-slate-300 backdrop-blur font-mono">
                  {selectedFile ? selectedFile.name : `Preset: ${activePreset}`}
                </div>
              </div>
            )}
          </div>

          {/* Detect Button */}
          <div className="pt-2">
            <button
              onClick={handleRunDetection}
              disabled={detecting || !selectedFile}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                selectedFile && !detecting
                  ? 'bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-98'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {detecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Processing Road Features...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Run Hazard Detection</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Detection Results & Save Form */}
        <div className="bg-[#1c2541] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Detection Output & Registration
          </h2>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {/* Result Card */}
          {detectionResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-3">
                {/* Source Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Attribution Source:</span>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-bold border flex items-center gap-1.5 ${
                      detectionResult.detection_source === 'Actual AI Inference'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-600 shadow-sm'
                        : 'bg-amber-950/80 text-amber-300 border-amber-600'
                    }`}
                  >
                    <span>{detectionResult.detection_source}</span>
                  </span>
                </div>

                {/* Classification & Confidence */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Identified Hazard:</span>
                    <span className="text-base font-bold text-white font-mono">
                      {detectionResult.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Calculated Severity:</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold border ${getSeverityBadge(detectionResult.severity)}`}>
                      {detectionResult.severity}
                    </span>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Detection Confidence:</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {Math.round(detectionResult.confidence * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.round(detectionResult.confidence * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Analysis Notes */}
                {detectionResult.notes && (
                  <p className="text-[11px] text-slate-400 italic bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                    {detectionResult.notes}
                  </p>
                )}
              </div>

              {/* Save As Hazard Form */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Register as Active Hazard in Database
                </h3>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 focus:border-cyan-500 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 focus:border-cyan-500 font-mono text-xs"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Use Device GPS Coordinates</span>
                </button>

                {/* Description */}
                <div className="text-xs">
                  <label className="text-slate-400 block mb-1">Inspection Notes / Summary</label>
                  <textarea
                    rows={2}
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 focus:border-cyan-500 text-xs"
                  />
                </div>

                {/* Submit to SQLite */}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveHazard(false)}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving to Database...' : 'Save to Hazard Registry'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Scan className="w-8 h-8 mx-auto opacity-40 text-cyan-400" />
              <p className="text-xs">Upload an image or pick a demo preset to see detection results.</p>
            </div>
          )}
        </div>
      </div>

      {/* Duplicate Warning Modal */}
      {duplicateWarning && (
        <DuplicateModal
          duplicateData={duplicateWarning}
          onConfirmForce={() => handleSaveHazard(true)}
          onViewExisting={(id) => navigate('/hazards')}
          onCancel={() => setDuplicateWarning(null)}
          isSubmitting={saving}
        />
      )}
    </div>
  );
}
