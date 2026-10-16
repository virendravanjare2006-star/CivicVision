import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PlusCircle,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Shield,
  UploadCloud,
  Car,
  Compass,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import DuplicateModal from '../components/DuplicateModal';

export default function ReportHazard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form Fields
  const [category, setCategory] = useState('Pothole');
  const [severity, setSeverity] = useState('High');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // States
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [geoLocating, setGeoLocating] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);

  // Check URL query params if clicked from map
  useEffect(() => {
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    if (latParam && lngParam) {
      setLatitude(latParam);
      setLongitude(lngParam);
    } else {
      // Default to metropolitan coordinates (Pune smart city corridor)
      setLatitude('18.5285');
      setLongitude('73.8521');
    }
  }, [searchParams]);

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB.');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Browser Geolocation with required permission notice
  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setGeoLocating(false);
      },
      (err) => {
        setGeoLocating(false);
        setError(`Location access error: ${err.message}. Please verify permission settings.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Form submission
  const handleSubmit = async (force = false) => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      // Validation
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lon)) {
        throw new Error('Please enter valid numeric latitude and longitude coordinates.');
      }

      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error('Coordinates out of valid range (-90 <= lat <= 90, -180 <= lon <= 180).');
      }

      if (!description.trim()) {
        throw new Error('Please provide a brief description of the road hazard.');
      }

      let uploadedFilename = null;

      // Upload image first if attached
      if (selectedImage) {
        const formData = new FormData();
        formData.append('image', selectedImage);
        try {
          const detRes = await api.detectImage(formData);
          uploadedFilename = detRes.image_path;
        } catch (uploadErr) {
          console.warn('Image upload error:', uploadErr);
        }
      }

      const payload = {
        category,
        severity,
        latitude: lat,
        longitude: lon,
        description: description.trim(),
        status: 'Detected',
        detection_source: 'Manual Field Report',
        confidence: null,
        image_path: uploadedFilename,
        is_demo: 0,
        force: force,
      };

      const res = await api.createHazard(payload);
      if (res.success) {
        setDuplicateData(null);
        setSuccess(`Field Hazard #${res.hazard.id} recorded and committed to SQLite!`);
        setTimeout(() => {
          navigate('/hazards');
        }, 1500);
      }
    } catch (err) {
      if (err.status === 409 && err.data?.duplicate_detected) {
        setDuplicateData(err.data);
      } else {
        setError(err.message || 'Failed to submit road hazard.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">
      {/* Driver Safety Reminder Banner (Section 7) */}
      <div className="bg-amber-950/40 border border-amber-600/50 rounded-2xl p-4 shadow-lg flex items-start gap-3.5">
        <Car className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <strong className="text-amber-300 font-bold tracking-wide uppercase text-[11px] block">
            ⚠️ Driver Safety Protocol Reminder
          </strong>
          <p className="text-slate-300 leading-relaxed">
            Never operate this mobile or desktop application while driving or operating a vehicle. Park safely in a designated rest bay before logging observations or taking photos.
          </p>
        </div>
      </div>

      {/* Main Report Form Card */}
      <div className="bg-[#1c2541] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Report Road Hazard / Field Observation
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manual hazard logging with coordinate validation and intelligent duplicate checking.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(false);
          }}
          className="space-y-5 text-xs"
        >
          {/* Category & Severity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
                Hazard Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-xs focus:border-cyan-500 transition"
              >
                <option value="Pothole">Pothole</option>
                <option value="Road Crack">Road Crack</option>
                <option value="Open Manhole">Open Manhole</option>
                <option value="Illegal Dumping">Illegal Dumping</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
                Severity Level *
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2.5 text-xs focus:border-cyan-500 transition"
              >
                <option value="Low">Low - Cosmetic surface defect</option>
                <option value="Medium">Medium - Noticeable vehicle impact</option>
                <option value="High">High - Tire hazard / significant cavity</option>
                <option value="Critical">Critical - Urgent fatal risk / open void</option>
              </select>
            </div>
          </div>

          {/* GPS Coordinates Section */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                GPS Coordinates (WGS84 Format) *
              </span>

              <button
                type="button"
                onClick={handleRequestGeolocation}
                disabled={geoLocating}
                className="text-cyan-400 hover:text-cyan-300 font-medium text-[11px] flex items-center gap-1"
                title="Uses device GPS sensor with user permission"
              >
                <Compass className={`w-3.5 h-3.5 ${geoLocating ? 'animate-spin' : ''}`} />
                <span>{geoLocating ? 'Acquiring GPS...' : 'Use Current Device GPS'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Browser geolocation requires explicit permission to acquire real GPS sensor data. Coordinates are never fabricated.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Latitude (-90.0 to +90.0)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 18.5285"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Longitude (-180.0 to +180.0)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 73.8521"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
              Incident Description & Field Notes *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe road defect location, lane position, depth, or nearby landmarks..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs focus:border-cyan-500 transition"
            />
          </div>

          {/* Optional Image Upload */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
              Attach Road Photo (Optional)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="border border-dashed border-slate-700 hover:border-cyan-500/70 rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer bg-slate-900/60 w-full sm:w-auto px-6 transition">
                <UploadCloud className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-300">Browse Image</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {imagePreview && (
                <div className="flex items-center gap-3">
                  <img
                    src={imagePreview}
                    alt="Uploaded road defect"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                  />
                  <span className="text-[11px] text-slate-400">
                    {selectedImage?.name} ({(selectedImage?.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{submitting ? 'Registering in SQLite...' : 'Submit Road Hazard Report'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Duplicate Alert Modal */}
      {duplicateData && (
        <DuplicateModal
          duplicateData={duplicateData}
          onConfirmForce={() => handleSubmit(true)}
          onViewExisting={(id) => navigate('/hazards')}
          onCancel={() => setDuplicateData(null)}
          isSubmitting={submitting}
        />
      )}
    </div>
  );
}
