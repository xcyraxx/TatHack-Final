import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const VEHICLE_COLORS = {
  'veh-1': '#06b6d4', // Cyan
  'veh-2': '#10b981', // Emerald
  'veh-3': '#8b5cf6', // Violet
  'veh-4': '#f59e0b', // Amber
};

export default function MapView({ lots, demands, vehicles, activePlan, lastBlastRadius }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!mapInstanceRef.current && mapContainerRef.current) {
      // Initialize Leaflet Map centered on Midtown Manhattan
      const map = L.map(mapContainerRef.current, {
        center: [40.742, -73.992],
        zoom: 13,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Dark theme CartoDB tiles for operations center look
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    // 1. Draw Depot
    const depotIcon = L.divIcon({
      className: 'depot-marker',
      html: `<div style="background:#0f172a; color:#f8fafc; border:2px solid #38bdf8; border-radius:8px; padding:4px 8px; font-weight:bold; font-size:11px; box-shadow:0 2px 8px rgba(0,0,0,0.4); text-align:center;">DEPOT (W 30th)</div>`,
      iconSize: [110, 26],
      iconAnchor: [55, 13],
    });
    L.marker([40.7516, -73.9998], { icon: depotIcon })
      .bindPopup(`<strong>Central Logistics Hub</strong><br>Midtown West Depot (W 30th St)`)
      .addTo(layerGroup);

    // 2. Draw Suppliers (Green)
    lots.forEach((lot) => {
      const isRefrig = lot.requires_refrigeration;
      const markerHtml = `
        <div style="background:#064e3b; color:#34d399; border:2px solid #10b981; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:11px; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
          S
        </div>
      `;
      const icon = L.divIcon({
        className: 'supplier-pin',
        html: markerHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([lot.location.lat, lot.location.lng], { icon })
        .bindPopup(`
          <div style="font-size:12px;">
            <strong style="color:#047857;">[DONOR] ${lot.donor_name}</strong><br>
            <strong>Food:</strong> ${lot.food_name} (${lot.quantity_kg}kg)<br>
            <strong>Category:</strong> ${lot.food_category}<br>
            <strong>Storage:</strong> ${lot.storage_type} ${isRefrig ? '❄️ (Cold Chain)' : '☀️'}<br>
            <strong>Expiry:</strong> t = ${lot.expiry_min} min
          </div>
        `)
        .addTo(layerGroup);
    });

    // 3. Draw Recipients (Blue)
    demands.forEach((dem) => {
      const isPriority3 = dem.priority_level === 3;
      const markerHtml = `
        <div style="background:${isPriority3 ? '#831843' : '#1e3a8a'}; color:${isPriority3 ? '#f472b6' : '#60a5fa'}; border:2px solid ${isPriority3 ? '#ec4899' : '#3b82f6'}; border-radius:6px; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:11px; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
          ${isPriority3 ? '★' : 'R'}
        </div>
      `;
      const icon = L.divIcon({
        className: 'recipient-pin',
        html: markerHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([dem.location.lat, dem.location.lng], { icon })
        .bindPopup(`
          <div style="font-size:12px;">
            <strong style="color:#1d4ed8;">[RECIPIENT] ${dem.recipient_name}</strong><br>
            <strong>Requested:</strong> ${dem.requested_kg}kg ${dem.food_category}<br>
            <strong>Priority:</strong> Level ${dem.priority_level} ${isPriority3 ? '(Emergency Shelter)' : ''}<br>
            <strong>Window:</strong> ${dem.delivery_window_start_min}m - ${dem.delivery_window_end_min}m
          </div>
        `)
        .addTo(layerGroup);
    });

    // 4. Draw Active Routes
    if (activePlan && activePlan.routes) {
      activePlan.routes.forEach((route) => {
        const color = VEHICLE_COLORS[route.vehicle_id] || '#3b82f6';
        const latlngs = route.stops.map((s) => [s.location.lat, s.location.lng]);

        if (latlngs.length >= 2) {
          // Draw Route Polyline
          L.polyline(latlngs, {
            color: color,
            weight: 4,
            opacity: 0.85,
            dashArray: route.stops.some(s => !s.is_frozen) ? '6, 6' : null,
          }).addTo(layerGroup);

          // Draw Sequence numbers along route
          route.stops.forEach((stop) => {
            if (stop.stop_type !== 'DEPOT') {
              const seqHtml = `
                <div style="background:${color}; color:#fff; border-radius:10px; padding:1px 5px; font-size:10px; font-weight:bold; border:1px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,0.4);">
                  #${stop.stop_sequence}
                </div>
              `;
              const seqIcon = L.divIcon({
                html: seqHtml,
                className: 'seq-badge',
                iconSize: [24, 16],
                iconAnchor: [12, -4],
              });
              L.marker([stop.location.lat, stop.location.lng], { icon: seqIcon })
                .bindPopup(`
                  <div style="font-size:12px;">
                    <strong>Stop #${stop.stop_sequence}: ${stop.stop_type}</strong><br>
                    <strong>Vehicle:</strong> ${route.vehicle_name}<br>
                    <strong>Location:</strong> ${stop.location_name}<br>
                    <strong>ETA:</strong> t = ${stop.arrival_time_min}m<br>
                    <strong>Details:</strong> ${stop.item_description}<br>
                    <strong>Load:</strong> ${stop.load_after_stop_kg}kg
                  </div>
                `)
                .addTo(layerGroup);
            }
          });
        }
      });
    }

    // 5. Highlight Disruption / Breakdown site if present
    if (lastBlastRadius && lastBlastRadius.target_id) {
      const breakdownLoc = [40.735, -73.995];
      const alertHtml = `
        <div class="animate-pulse-glow" style="background:#dc2626; color:#ffffff; border:2px solid #fee2e2; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px;">
          ⚠️
        </div>
      `;
      const alertIcon = L.divIcon({
        className: 'alert-pin',
        html: alertHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker(breakdownLoc, { icon: alertIcon })
        .bindPopup(`
          <div style="font-size:12px; color:#991b1b;">
            <strong>🚨 PERTURBATION BLAST RADIUS</strong><br>
            <strong>Event:</strong> ${lastBlastRadius.disruption_type}<br>
            <strong>Target:</strong> ${lastBlastRadius.target_id}<br>
            <strong>Status:</strong> ${lastBlastRadius.status}<br>
            <strong>Replan Time:</strong> ${lastBlastRadius.replan_latency_ms}ms
          </div>
        `)
        .addTo(layerGroup);
    }
  }, [lots, demands, vehicles, activePlan, lastBlastRadius]);

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '520px' }} />

      {/* Map Legend Overlay */}
      <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 text-xs text-slate-200 shadow-xl pointer-events-auto">
        <div className="font-semibold text-slate-100 mb-2 tracking-wide uppercase">Operations Network</div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-300 inline-block"></span>
          <span>Donation Supplier (Pickup)</span>
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-blue-500 border border-blue-300 inline-block"></span>
          <span>Community Recipient (Delivery)</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-3.5 h-3.5 rounded-sm bg-pink-600 border border-pink-300 inline-block"></span>
          <span>Emergency Shelter (Priority 3)</span>
        </div>
        <div className="border-t border-slate-800 pt-2 mb-1 font-semibold text-slate-300">Fleet Routes:</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-cyan-400 inline-block"></span>
            <span>Van 01 (Cold)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-400 inline-block"></span>
            <span>Van 02 (Dry)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-violet-400 inline-block"></span>
            <span>Van 03 (Rapid)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-amber-400 inline-block"></span>
            <span>Van 04 (Cold)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
