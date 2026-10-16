import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import {
  Layers,
  Filter,
  PlusCircle,
  WifiOff,
  RefreshCw,
  MapPin,
  ExternalLink,
  Info,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import HazardModal from '../components/HazardModal';

export default function HazardMap() {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tileError, setTileError] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');

  // Click-to-add mode state
  const [clickedCoords, setClickedCoords] = useState(null);

  // Fetch hazards from backend
  const fetchHazards = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getHazards();
      if (res.success) {
        setHazards(res.hazards);
      }
    } catch (err) {
      setError(err.message || 'Failed to load hazard telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHazards();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent double-initialization

    // Default center on metropolitan corridor (Pune / Smart City corridor: 18.528, 73.850)
    const initialCenter = [18.528, 73.850];
    const initialZoom = 13;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
    });

    // OpenStreetMap standard tile layer
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    });

    tileLayer.on('tileerror', () => {
      setTileError(true);
    });

    tileLayer.addTo(map);

    // Layer group for dynamic markers
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Click on map to add hazard
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setClickedCoords({
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Create custom colored SVG marker icon
  const createCustomIcon = (severity) => {
    let color = '#00f5d4'; // default cyan (Low)
    let ringColor = 'rgba(0, 245, 212, 0.4)';
    if (severity === 'Critical') {
      color = '#f43f5e'; // rose/red
      ringColor = 'rgba(244, 63, 94, 0.4)';
    } else if (severity === 'High') {
      color = '#f97316'; // orange
      ringColor = 'rgba(249, 115, 22, 0.4)';
    } else if (severity === 'Medium') {
      color = '#f59e0b'; // amber
      ringColor = 'rgba(245, 158, 11, 0.4)';
    }

    const html = `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${ringColor};
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: relative;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #0f172a;
          border: 3px solid ${color};
          box-shadow: 0 4px 10px rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></div>
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-hazard-pin',
      html: html,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  // Update markers when hazards or filters change
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;

    markersLayerRef.current.clearLayers();

    const filtered = hazards.filter((h) => {
      const matchCat = categoryFilter === 'All' || h.category === categoryFilter;
      const matchSev = severityFilter === 'All' || h.severity === severityFilter;
      return matchCat && matchSev;
    });

    const bounds = [];

    filtered.forEach((h) => {
      if (h.latitude == null || h.longitude == null) return;

      const marker = L.marker([h.latitude, h.longitude], {
        icon: createCustomIcon(h.severity),
      });

      const popupContent = document.createElement('div');
      popupContent.className = 'text-xs space-y-2';
      popupContent.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
          <strong style="color: #38bdf8; font-size: 13px;">${h.category}</strong>
          <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: rgba(56, 189, 248, 0.15); color: #38bdf8;">
            ${h.severity}
          </span>
        </div>
        ${h.is_demo === 1 ? '<div style="font-size: 9px; color: #f59e0b; background: rgba(245, 158, 11, 0.15); padding: 2px 4px; border-radius: 3px; display: inline-block;">Demo Incident</div>' : ''}
        <p style="color: #cbd5e1; font-size: 11px; margin: 4px 0;">${h.description || 'No description'}</p>
        <div style="font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #334155; padding-top: 4px;">
          <span>Status: <strong>${h.status}</strong></span>
          <span>${h.latitude.toFixed(4)}, ${h.longitude.toFixed(4)}</span>
        </div>
        <button id="btn-modal-${h.id}" style="
          width: 100%;
          margin-top: 6px;
          padding: 4px 8px;
          border-radius: 4px;
          background: #0284c7;
          color: white;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 11px;
        ">
          View & Update Status
        </button>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-modal-${h.id}`);
        if (btn) {
          btn.onclick = () => setSelectedHazard(h);
        }
      });

      marker.addTo(markersLayerRef.current);
      bounds.push([h.latitude, h.longitude]);
    });

    // Auto-fit view if markers exist
    if (bounds.length > 0 && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [hazards, categoryFilter, severityFilter]);

  const handleHazardUpdated = (updated) => {
    setHazards((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
    setSelectedHazard(updated);
  };

  const handleHazardDeleted = (id) => {
    setHazards((prev) => prev.filter((h) => h.id !== id));
    setSelectedHazard(null);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Top Filter & Toolbar Bar */}
      <div className="bg-[#1c2541] border-b border-slate-800 p-4 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-md z-10">
        {/* Category & Severity Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium mr-2">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Map Filters:</span>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Categories</option>
            <option value="Pothole">Pothole</option>
            <option value="Road Crack">Road Crack</option>
            <option value="Open Manhole">Open Manhole</option>
            <option value="Illegal Dumping">Illegal Dumping</option>
          </select>

          {/* Severity Dropdown */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {(categoryFilter !== 'All' || severityFilter !== 'All') && (
            <button
              onClick={() => {
                setCategoryFilter('All');
                setSeverityFilter('All');
              }}
              className="text-cyan-400 hover:text-cyan-300 text-xs px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Legend & Navigation Actions */}
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Critical
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Low
            </span>
          </div>

          <button
            onClick={() => navigate('/hazards')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
          >
            View Table View
          </button>
        </div>
      </div>

      {/* Map Container Area */}
      <div className="flex-1 relative">
        {/* Offline / Tile Error Banner */}
        {tileError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-amber-950/90 border border-amber-600/80 text-amber-200 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-xs backdrop-blur max-w-md">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Map tiles could not load (OpenStreetMap tile server unavailable or no internet). Markers and coordinate tools remain active.
            </span>
          </div>
        )}

        {/* Click-to-add Prompt Toast */}
        {clickedCoords && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-[#1c2541]/95 border border-cyan-500/80 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>
                Selected Location: <strong className="font-mono text-cyan-300">{clickedCoords.lat}, {clickedCoords.lng}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  navigate(`/report?lat=${clickedCoords.lat}&lng=${clickedCoords.lng}`)
                }
                className="px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg transition"
              >
                Report Hazard Here
              </button>
              <button
                onClick={() => setClickedCoords(null)}
                className="px-2 py-1 text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Real Leaflet Map DIV */}
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Hazard Modal */}
      {selectedHazard && (
        <HazardModal
          hazard={selectedHazard}
          onClose={() => setSelectedHazard(null)}
          onUpdated={handleHazardUpdated}
          onDeleted={handleHazardDeleted}
        />
      )}
    </div>
  );
}
