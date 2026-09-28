import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DhakaZone, RideRequest } from '../types';
import { Navigation, MapPin, Zap, Layers, Compass, Plus, Minus } from 'lucide-react';

interface DhakaMapCorridorProps {
  zones: DhakaZone[];
  selectedPickup?: string;
  selectedDropoff?: string;
  activeRides?: RideRequest[];
  onSelectZone?: (zoneId: string, type?: 'pickup' | 'dropoff') => void;
}

export const DhakaMapCorridor: React.FC<DhakaMapCorridorProps> = ({
  zones,
  selectedPickup = 'BANANI',
  selectedDropoff = 'MOHAKHALI',
  activeRides = [],
  onSelectZone
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Corridor center coordinates (Banani - Mohakhali focus)
  const CORRIDOR_CENTER: [number, number] = [23.7865, 90.4100];
  const CORRIDOR_ZOOM = 14;

  // 1. Initialize Clean ESRI Dark Gray Canvas (Zero keys, zero watermarks, zero clutter)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: CORRIDOR_CENTER,
      zoom: CORRIDOR_ZOOM,
      minZoom: 11,
      maxZoom: 17,
      zoomControl: false,
      attributionControl: false
    });

    // ESRI World Dark Gray Base: Ultra-clean, distraction-free obsidian transit canvas
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 16,
        attribution: '&copy; Esri &mdash; Open Data'
      }
    ).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;
    setMapReady(true);

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
      setMapReady(false);
    };
  }, []);

  // 2. Render Elegant, Uncluttered Markers & Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers || !mapReady) return;

    layers.clearLayers();

    // Map zone by ID for fast lookup
    const zoneMap = new Map<string, DhakaZone>();
    zones.forEach((z) => zoneMap.set(z.id, z));

    // 1. Draw Clean Route Corridors
    const banani = zoneMap.get('BANANI');
    const mohakhali = zoneMap.get('MOHAKHALI');
    const gulshan1 = zoneMap.get('GULSHAN_1');

    // Nusrat Route: Banani 11 -> Mohakhali (4.0 km) - Primary Volt-Lime corridor
    if (banani && mohakhali) {
      const nusratCoords: [number, number][] = [
        [banani.latitude, banani.longitude],
        [23.7870, 90.4068],
        [23.7820, 90.4060],
        [mohakhali.latitude, mohakhali.longitude]
      ];

      // Glow halo line
      L.polyline(nusratCoords, {
        color: '#D2F832',
        weight: 6,
        opacity: 0.25,
        lineCap: 'round'
      }).addTo(layers);

      // Core line
      L.polyline(nusratCoords, {
        color: '#D2F832',
        weight: 3,
        opacity: 0.9,
        dashArray: '8, 6'
      })
        .addTo(layers)
        .bindTooltip('Nusrat Corridor: Banani 11 ⇄ Mohakhali (4.0 km)', {
          permanent: false,
          direction: 'top',
          className: 'leaflet-dark-tooltip'
        });
    }

    // Rafiq Route: Banani 11 -> Gulshan 1 (3.2 km) - Compatible Shared Lane
    if (banani && gulshan1) {
      const rafiqCoords: [number, number][] = [
        [banani.latitude, banani.longitude],
        [23.7925, 90.4125],
        [23.7850, 90.4160],
        [gulshan1.latitude, gulshan1.longitude]
      ];

      L.polyline(rafiqCoords, {
        color: '#38BDF8',
        weight: 2.5,
        opacity: 0.8,
        dashArray: '5, 5'
      })
        .addTo(layers)
        .bindTooltip('Rafiq Pooled Route: Banani 11 ⇄ Gulshan 1 (3.2 km)', {
          permanent: false,
          direction: 'top',
          className: 'leaflet-dark-tooltip'
        });
    }

    // Active dynamically booked rides
    activeRides.forEach((ride) => {
      const from = zoneMap.get(ride.pickup_zone);
      const to = zoneMap.get(ride.destination_zone);
      if (from && to) {
        L.polyline(
          [
            [from.latitude, from.longitude],
            [to.latitude, to.longitude]
          ],
          {
            color: '#D2F832',
            weight: 3.5,
            opacity: 0.95
          }
        ).addTo(layers);
      }
    });

    // 2. Render Zone Markers with Clean Hierarchy (No overlapping pill clutter)
    zones.forEach((zone) => {
      const isPickup = selectedPickup === zone.id;
      const isDropoff = selectedDropoff === zone.id;
      const isCoreCorridor = ['BANANI', 'MOHAKHALI', 'GULSHAN_1', 'GULSHAN_2'].includes(zone.id);

      let customHtml = '';

      if (isPickup) {
        // High-priority Pickup Beacon with floating top pill
        customHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background: #FFFFFF; color: #000000; font-weight: 800; font-family: monospace; font-size: 10px; padding: 2px 7px; border-radius: 9999px; box-shadow: 0 0 15px rgba(255,255,255,0.7); white-space: nowrap; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; width: 5px; height: 5px; border-radius: 9999px; background: #000;"></span>
              <span>${zone.name.split(' ')[0]} (Pickup)</span>
            </div>
            <div style="width: 14px; height: 14px; border-radius: 9999px; background: #FFFFFF; border: 2px solid #000000; box-shadow: 0 0 12px #FFFFFF;"></div>
          </div>
        `;
      } else if (isDropoff) {
        // High-priority Dropoff Beacon with floating top pill
        customHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background: #D2F832; color: #000000; font-weight: 800; font-family: monospace; font-size: 10px; padding: 2px 7px; border-radius: 9999px; box-shadow: 0 0 15px rgba(210,248,50,0.8); white-space: nowrap; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; width: 5px; height: 5px; border-radius: 9999px; background: #000;"></span>
              <span>${zone.name.split(' ')[0]} (Dropoff)</span>
            </div>
            <div style="width: 14px; height: 14px; border-radius: 9999px; background: #D2F832; border: 2px solid #000000; box-shadow: 0 0 12px rgba(210,248,50,0.9);"></div>
          </div>
        `;
      } else if (isCoreCorridor) {
        // Subtle waypoint dot with tiny label
        customHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%); cursor: pointer;">
            <div style="width: 10px; height: 10px; border-radius: 9999px; background: #121216; border: 2px solid rgba(210,248,50,0.7); box-shadow: 0 0 8px rgba(210,248,50,0.4);"></div>
            <span style="position: absolute; top: 12px; font-family: monospace; font-size: 9px; color: #A1A1AA; white-space: nowrap; text-shadow: 0 1px 3px #000;">
              ${zone.name.split(' ')[0]}
            </span>
          </div>
        `;
      } else {
        // Outer metro zones (Mirpur, Uttara, Farmgate, Dhanmondi): Minimal clean waypoint dot
        customHtml = `
          <div style="display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); cursor: pointer;">
            <div style="width: 8px; height: 8px; border-radius: 9999px; background: #27272A; border: 1.5px solid rgba(255,255,255,0.3); transition: transform 0.15s ease;"></div>
          </div>
        `;
      }

      const icon = L.divIcon({
        className: 'uncluttered-zone-pin',
        html: customHtml,
        iconSize: [0, 0]
      });

      const marker = L.marker([zone.latitude, zone.longitude], {
        icon,
        zIndexOffset: isPickup || isDropoff ? 500 : 100
      }).addTo(layers);

      // Compact popup on click
      const popupHtml = `
        <div style="background: #121216; color: #fff; padding: 8px 12px; border-radius: 12px; font-family: sans-serif; min-width: 160px; border: 1px solid rgba(255,255,255,0.12);">
          <div style="font-weight: 800; font-size: 12px; color: #D2F832; margin-bottom: 2px;">${zone.name}</div>
          <div style="font-size: 10px; color: #A1A1AA; font-family: monospace; margin-bottom: 4px;">${zone.bnName} • ${zone.corridor.replace('_', ' ')}</div>
          <div style="font-size: 10px; color: #71717A; margin-bottom: 8px;">${zone.description}</div>
          <div style="display: flex; gap: 5px;">
            <button id="btn-pickup-${zone.id}" style="background: #27272A; color: #fff; border: 1px solid rgba(255,255,255,0.2); font-size: 9px; padding: 3px 6px; border-radius: 5px; cursor: pointer; flex: 1;">Set Pickup</button>
            <button id="btn-dropoff-${zone.id}" style="background: #D2F832; color: #000; font-weight: 700; border: none; font-size: 9px; padding: 3px 6px; border-radius: 5px; cursor: pointer; flex: 1;">Set Dropoff</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-dark-popup',
        closeButton: false
      });

      marker.on('popupopen', () => {
        const pBtn = document.getElementById(`btn-pickup-${zone.id}`);
        const dBtn = document.getElementById(`btn-dropoff-${zone.id}`);
        if (pBtn && onSelectZone) {
          pBtn.onclick = () => {
            onSelectZone(zone.id, 'pickup');
            map.closePopup();
          };
        }
        if (dBtn && onSelectZone) {
          dBtn.onclick = () => {
            onSelectZone(zone.id, 'dropoff');
            map.closePopup();
          };
        }
      });
    });

    // 3. Jashim's "Bullet" Vehicle: Clean Puck Marker (Offset from Banani 11)
    // Placed along Kemal Ataturk Avenue corridor south of Banani 11
    const bulletPos: [number, number] = [23.7895, 90.4072];

    const bulletHtml = `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%); cursor: pointer;">
        <!-- Pulsing Radar Wave -->
        <div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background: rgba(210,248,50,0.2); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        
        <!-- Tesla Vehicle Puck -->
        <div style="width: 24px; height: 24px; border-radius: 9999px; background: #0E0E12; border: 2px solid #D2F832; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px rgba(210,248,50,0.8); z-index: 10;">
          <svg style="width: 12px; height: 12px; fill: #D2F832;" viewBox="0 0 24 24">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>

        <!-- Clean floating vehicle badge -->
        <div style="position: absolute; top: 26px; background: #121216; color: #D2F832; border: 1px solid rgba(210,248,50,0.5); font-family: monospace; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.8);">
          Bullet (Jashim)
        </div>
      </div>
    `;

    const bulletIcon = L.divIcon({
      className: 'custom-bullet-puck',
      html: bulletHtml,
      iconSize: [0, 0]
    });

    L.marker(bulletPos, { icon: bulletIcon, zIndexOffset: 1000 })
      .addTo(layers)
      .bindTooltip("Jashim's Bullet • Electric 3-Seat Trike • Cruising Banani Corridor", {
        permanent: false,
        direction: 'top',
        className: 'leaflet-dark-tooltip'
      });
  }, [zones, selectedPickup, selectedDropoff, activeRides, mapReady]);

  // Center button helper
  const handleResetCorridorView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(CORRIDOR_CENTER, CORRIDOR_ZOOM, {
      duration: 1.0
    });
  };

  // Fit all zones bounds
  const handleFitAllZones = () => {
    if (!mapInstanceRef.current || zones.length === 0) return;
    const bounds = L.latLngBounds(zones.map((z) => [z.latitude, z.longitude]));
    mapInstanceRef.current.fitBounds(bounds, {
      padding: [45, 45],
      duration: 1.0
    });
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <div className="bg-[#121216] border border-white/10 rounded-[32px] p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#D2F832]/10 border border-[#D2F832]/30 flex items-center justify-center text-[#D2F832]">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              Dhaka Electric Corridor Map
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D2F832]/15 text-[#D2F832] border border-[#D2F832]/30">
                LIVE GIS
              </span>
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              Banani 11 Hub ⇄ Mohakhali & Gulshan Shared Lanes
            </p>
          </div>
        </div>

        {/* Minimal Legend */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white inline-block shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
            <span className="text-zinc-400">Pickup</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D2F832] inline-block shadow-[0_0_8px_rgba(210,248,50,0.8)]" />
            <span className="text-zinc-400">Dropoff</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] inline-block" />
            <span className="text-zinc-400">Pool Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D2F832] inline-block animate-ping" />
            <span className="text-zinc-300 font-bold">Bullet</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-80 sm:h-96 rounded-2xl border border-white/10 overflow-hidden bg-[#0A0A0E]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Clean Floating Zoom & Navigation Controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl bg-[#181820]/90 hover:bg-[#222228] backdrop-blur-md text-white flex items-center justify-center border border-white/10 shadow-lg hover:text-[#D2F832] transition-colors"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl bg-[#181820]/90 hover:bg-[#222228] backdrop-blur-md text-white flex items-center justify-center border border-white/10 shadow-lg hover:text-[#D2F832] transition-colors"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Perspective Presets */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
          <button
            onClick={handleResetCorridorView}
            className="flex items-center gap-1.5 bg-[#181820]/90 hover:bg-[#222228] backdrop-blur-md text-white text-[11px] font-mono px-3 py-1.5 rounded-full border border-white/10 shadow-lg hover:border-[#D2F832]/40 transition-all"
            title="Focus Banani-Mohakhali Corridor"
          >
            <Compass className="w-3.5 h-3.5 text-[#D2F832]" />
            <span>Banani Corridor</span>
          </button>

          <button
            onClick={handleFitAllZones}
            className="flex items-center gap-1.5 bg-[#181820]/90 hover:bg-[#222228] backdrop-blur-md text-white text-[11px] font-mono px-3 py-1.5 rounded-full border border-white/10 shadow-lg hover:border-white/25 transition-all"
            title="Fit All Dhaka Metro Zones"
          >
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>All Zones</span>
          </button>
        </div>
      </div>

      {/* Corridor Telemetry Footer */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
        <span className="flex items-center gap-1.5 text-zinc-300">
          <MapPin className="w-3.5 h-3.5 text-[#D2F832]" />
          <span>Banani Road 11 Hub: 23.7937° N, 90.4066° E</span>
        </span>
        <span className="text-zinc-500">
          ESRI World Dark Canvas • Zero API Keys • Uncluttered Transit GIS
        </span>
      </div>
    </div>
  );
};
