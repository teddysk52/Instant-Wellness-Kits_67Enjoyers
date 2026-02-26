import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ─── Constants ─── */
const HQ: [number, number] = [40.7549, -73.984];
const SPEED_OPTIONS = [1, 2, 5, 10] as const;
const BASE_KM_PER_SEC = 1.4;

/* ─── Haversine ─── */
function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const la = (a[0] * Math.PI) / 180;
  const lb = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la) * Math.cos(lb) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/* ─── SVG Icons ─── */
const droneSvg = `
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g filter="url(#ds)">
    <circle cx="18" cy="18" r="13" fill="#2563EB" stroke="white" stroke-width="2"/>
    <circle cx="18" cy="18" r="3.5" fill="white"/>
    <line x1="18" y1="11" x2="18" y2="6" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="18" y1="25" x2="18" y2="30" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="11" y1="18" x2="6" y2="18" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="25" y1="18" x2="30" y2="18" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="6" cy="18" r="2.5" fill="white" fill-opacity="0.35"/>
    <circle cx="30" cy="18" r="2.5" fill="white" fill-opacity="0.35"/>
    <circle cx="18" cy="6" r="2.5" fill="white" fill-opacity="0.35"/>
    <circle cx="18" cy="30" r="2.5" fill="white" fill-opacity="0.35"/>
  </g>
  <defs>
    <filter id="ds" x="-2" y="-1" width="40" height="41" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.35"/>
    </filter>
  </defs>
</svg>`;

const hqSvg = `
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="17" fill="#0F172A" stroke="white" stroke-width="2.5"/>
  <path d="M13 27V19L20 14L27 19V27" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="18" y="23" width="4" height="4" rx="0.5" stroke="white" stroke-width="1.2" fill="none"/>
  <rect x="14.5" y="19.5" width="3" height="3" rx="0.5" fill="white" fill-opacity="0.3"/>
  <rect x="22.5" y="19.5" width="3" height="3" rx="0.5" fill="white" fill-opacity="0.3"/>
</svg>`;

const targetSvg = `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="12" stroke="#EF4444" stroke-width="2" stroke-dasharray="4 3" fill="#EF4444" fill-opacity="0.08"/>
  <circle cx="16" cy="16" r="6" stroke="#EF4444" stroke-width="1.5" fill="#EF4444" fill-opacity="0.15"/>
  <circle cx="16" cy="16" r="2.5" fill="#EF4444"/>
  <line x1="16" y1="2" x2="16" y2="8" stroke="#EF4444" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="16" y1="24" x2="16" y2="30" stroke="#EF4444" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="2" y1="16" x2="8" y2="16" stroke="#EF4444" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="24" y1="16" x2="30" y2="16" stroke="#EF4444" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

const deliveredSvg = `
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="8" cy="8" r="5.5" fill="#22C55E" stroke="white" stroke-width="2"/>
  <path d="M5.5 8L7.2 9.7L10.5 6.3" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const smallDotSvg = `
<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
  <circle cx="5" cy="5" r="3.5" fill="#3B82F6" fill-opacity="0.4" stroke="white" stroke-width="1"/>
</svg>`;

function mkIcon(html: string, size: number) {
  const a = size / 2;
  return L.divIcon({ html, className: "", iconSize: [size, size], iconAnchor: [a, a] });
}

const droneIcon = mkIcon(`<div class="drone-marker">${droneSvg}</div>`, 36);
const hqIcon = mkIcon(hqSvg, 40);
const targetIconObj = mkIcon(`<div class="target-marker">${targetSvg}</div>`, 32);
const deliveredIcon = mkIcon(deliveredSvg, 16);
const dotIcon = mkIcon(smallDotSvg, 10);

/* ─── Types ─── */
type Phase = "idle" | "to-target" | "delivering" | "returning" | "complete";

interface Delivery {
  id: string;
  lat: number;
  lng: number;
  dist: number;
  ts: number;
}

/* ─── Component ─── */
export default function MapPage() {
  const { t } = useTranslation();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapObj = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const droneRef = useRef<L.Marker | null>(null);
  const targetMkr = useRef<L.Marker | null>(null);
  const trailOut = useRef<L.Polyline | null>(null);
  const trailBack = useRef<L.Polyline | null>(null);

  const [target, setTarget] = useState<[number, number] | null>(null);
  const [inputLat, setInputLat] = useState("");
  const [inputLng, setInputLng] = useState("");
  const [speed, setSpeed] = useState<number>(1);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [distKm, setDistKm] = useState(0);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  const animId = useRef<number | null>(null);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  /* ─── Init map ─── */
  useEffect(() => {
    if (!mapEl.current || mapObj.current) return;

    const m = L.map(mapEl.current, {
      center: [42.0, -75.5],
      zoom: 7,
      zoomControl: false,
      minZoom: 6,
      maxZoom: 18,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }
    ).addTo(m);

    L.control.zoom({ position: "bottomright" }).addTo(m);

    L.marker(HQ, { icon: hqIcon })
      .addTo(m)
      .bindPopup(
        `<div style="text-align:center;font-family:system-ui;padding:4px 0">
          <strong style="font-size:13px">IWK Headquarters</strong><br/>
          <span style="font-size:11px;color:#94a3b8">Drone Dispatch Center</span><br/>
          <span style="font-size:10px;color:#64748b">Manhattan, NY</span>
        </div>`
      );

    const lg = L.layerGroup().addTo(m);
    layersRef.current = lg;

    const drone = L.marker(HQ, { icon: droneIcon, opacity: 0, zIndexOffset: 1000 }).addTo(m);
    droneRef.current = drone;

    trailOut.current = L.polyline([], {
      color: "#3B82F6",
      weight: 2.5,
      opacity: 0.7,
      dashArray: "8 6",
    }).addTo(m);

    trailBack.current = L.polyline([], {
      color: "#F59E0B",
      weight: 2.5,
      opacity: 0.7,
      dashArray: "8 6",
    }).addTo(m);

    mapObj.current = m;
    loadRecentOrders(lg);

    return () => {
      m.remove();
      mapObj.current = null;
    };
  }, []);

  /* ─── Load orders ─── */
  const loadRecentOrders = async (layer: L.LayerGroup) => {
    try {
      const res = await fetch("http://localhost:3001/orders?limit=200&sortOrder=desc");
      const data = await res.json();
      if (data?.data) {
        for (const o of data.data) {
          L.marker([o.lat ?? o.latitude, o.lon ?? o.longitude], { icon: dotIcon, opacity: 0.5 })
            .addTo(layer)
            .bindPopup(
              `<div style="font-family:system-ui;font-size:11px;padding:2px 0">
                <strong>${o.jurisdictions?.county || "NY"}</strong><br/>
                $${Number(o.totalAmount).toFixed(2)}
              </div>`
            );
        }
      }
    } catch {
      /* silent */
    }
  };

  /* ─── Place target on click ─── */
  const handleMapClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (phase !== "idle") return;
      const { lat, lng } = e.latlng;
      setTarget([lat, lng]);
      setInputLat(lat.toFixed(6));
      setInputLng(lng.toFixed(6));

      if (targetMkr.current) {
        targetMkr.current.setLatLng([lat, lng]).setOpacity(1);
      } else if (mapObj.current) {
        targetMkr.current = L.marker([lat, lng], { icon: targetIconObj, zIndexOffset: 900 }).addTo(mapObj.current);
      }
    },
    [phase]
  );

  useEffect(() => {
    const m = mapObj.current;
    if (!m) return;
    m.on("click", handleMapClick);
    return () => { m.off("click", handleMapClick); };
  }, [handleMapClick]);

  /* ─── Sync typed coords → target marker ─── */
  useEffect(() => {
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= 39 && lat <= 46 && lng >= -80 && lng <= -70) {
      setTarget([lat, lng]);
      if (targetMkr.current) {
        targetMkr.current.setLatLng([lat, lng]).setOpacity(1);
      } else if (mapObj.current) {
        targetMkr.current = L.marker([lat, lng], { icon: targetIconObj, zIndexOffset: 900 }).addTo(mapObj.current);
      }
    }
  }, [inputLat, inputLng]);

  /* ─── Bezier helpers ─── */
  function makeBezier(from: [number, number], to: [number, number], arc: number) {
    const midLat = (from[0] + to[0]) / 2 + Math.abs(to[1] - from[1]) * arc;
    const midLng = (from[1] + to[1]) / 2;
    return (t: number): [number, number] => {
      const u = 1 - t;
      return [
        u * u * from[0] + 2 * u * t * midLat + t * t * to[0],
        u * u * from[1] + 2 * u * t * midLng + t * t * to[1],
      ];
    };
  }

  function ease(t: number) {
    return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  }

  function trail(fn: (t: number) => [number, number], p: number) {
    const pts: [number, number][] = [];
    const n = Math.max(1, Math.floor(p * 120));
    for (let i = 0; i <= n; i++) pts.push(fn(i / 120));
    return pts;
  }

  /* ─── Launch ─── */
  const launch = useCallback(() => {
    if (!target || !mapObj.current || !droneRef.current || !trailOut.current || !trailBack.current) return;

    const dest = target;
    const dist = haversineKm(HQ, dest);
    const baseDurMs = Math.max(3000, (dist / BASE_KM_PER_SEC) * 1000);

    setDistKm(dist);
    setPhase("to-target");
    setProgress(0);

    if (targetMkr.current) targetMkr.current.setOpacity(0);

    const drone = droneRef.current;
    const tO = trailOut.current;
    const tB = trailBack.current;

    drone.setLatLng(HQ).setOpacity(1);
    tO.setLatLngs([]);
    tB.setLatLngs([]);

    mapObj.current.fitBounds(L.latLngBounds([HQ, dest]), { padding: [100, 100], maxZoom: 12, animate: true });

    const bezOut = makeBezier(HQ, dest, 0.12);
    const bezRet = makeBezier(dest, HQ, 0.08);

    let acc = 0;
    let lastT = performance.now();

    const flyOut = (now: number) => {
      const dt = now - lastT;
      lastT = now;
      acc += (dt / baseDurMs) * speedRef.current;
      const p = Math.min(acc, 1);
      setProgress(p);

      const e = ease(p);
      drone.setLatLng(bezOut(e));
      tO.setLatLngs(trail(bezOut, e));

      if (p < 1) {
        animId.current = requestAnimationFrame(flyOut);
      } else {
        setPhase("delivering");

        const did = Date.now().toString();
        if (layersRef.current) {
          L.marker(dest, { icon: deliveredIcon })
            .addTo(layersRef.current)
            .bindPopup(
              `<div style="font-family:system-ui;font-size:11px;padding:2px 0">
                <strong>${t("map.delivered")}</strong><br/>
                <span style="color:#64748b">${dest[0].toFixed(4)}, ${dest[1].toFixed(4)}</span><br/>
                <span style="color:#64748b">${dist.toFixed(1)} km</span>
              </div>`
            );
        }

        if (mapObj.current) {
          const pulse = L.circleMarker(dest, {
            radius: 6, color: "#22C55E", fillColor: "#22C55E", fillOpacity: 0.4, weight: 2,
          }).addTo(mapObj.current);
          let r = 6;
          const pi = setInterval(() => {
            r += 1.5;
            pulse.setRadius(r);
            pulse.setStyle({ fillOpacity: Math.max(0, 0.4 - r * 0.012), opacity: Math.max(0, 0.8 - r * 0.025) });
            if (r > 35) { clearInterval(pi); mapObj.current?.removeLayer(pulse); }
          }, 25);
        }

        setDeliveries((prev) => [{ id: did, lat: dest[0], lng: dest[1], dist, ts: Date.now() }, ...prev.slice(0, 9)]);

        const pause = Math.max(600, 1800 / speedRef.current);
        setTimeout(() => {
          setPhase("returning");
          setProgress(0);
          acc = 0;
          lastT = performance.now();
          animId.current = requestAnimationFrame(flyBack);
        }, pause);
      }
    };

    const flyBack = (now: number) => {
      const dt = now - lastT;
      lastT = now;
      acc += (dt / baseDurMs) * speedRef.current;
      const p = Math.min(acc, 1);
      setProgress(p);

      const e = ease(p);
      drone.setLatLng(bezRet(e));
      tB.setLatLngs(trail(bezRet, e));

      if (p < 1) {
        animId.current = requestAnimationFrame(flyBack);
      } else {
        drone.setOpacity(0);
        setPhase("complete");
        setTimeout(() => {
          setPhase("idle");
          setProgress(0);
          tO.setLatLngs([]);
          tB.setLatLngs([]);
          setTarget(null);
        }, 1500);
      }
    };

    animId.current = requestAnimationFrame(flyOut);
  }, [target, t]);

  /* ─── Cleanup ─── */
  useEffect(() => {
    return () => { if (animId.current) cancelAnimationFrame(animId.current); };
  }, []);

  /* ─── Derived ─── */
  const isActive = phase !== "idle" && phase !== "complete";
  const canLaunch = phase === "idle" && target !== null;

  const phaseLabel: Record<Phase, string> = {
    idle: "",
    "to-target": t("map.toTarget"),
    delivering: t("map.delivering"),
    returning: t("map.returning"),
    complete: t("map.complete"),
  };

  const phaseColor: Record<Phase, string> = {
    idle: "",
    "to-target": "bg-blue-500",
    delivering: "bg-green-500",
    returning: "bg-amber-500",
    complete: "bg-green-500",
  };

  /* ─── Render ─── */
  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 3.5rem)" }}>
      <style>{`
        .drone-marker { filter: drop-shadow(0 2px 6px rgba(37,99,235,0.4)); animation: drone-bob 2s ease-in-out infinite; }
        @keyframes drone-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        .target-marker { animation: target-spin 8s linear infinite; }
        @keyframes target-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .leaflet-container { background: #0f172a !important; }
      `}</style>

      <div ref={mapEl} className="absolute inset-0" />

      {/* ─── Dispatch Panel ─── */}
      <div className="absolute left-4 top-4 z-[1000] w-[280px]">
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/90 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="3" fill="#3B82F6"/>
                <line x1="10" y1="5" x2="10" y2="2" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="10" y1="15" x2="10" y2="18" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="5" y1="10" x2="2" y2="10" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="15" y1="10" x2="18" y2="10" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="2" cy="10" r="1.5" fill="#3B82F6" fillOpacity="0.3"/>
                <circle cx="18" cy="10" r="1.5" fill="#3B82F6" fillOpacity="0.3"/>
                <circle cx="10" cy="2" r="1.5" fill="#3B82F6" fillOpacity="0.3"/>
                <circle cx="10" cy="18" r="1.5" fill="#3B82F6" fillOpacity="0.3"/>
              </svg>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-white leading-tight">{t("map.dispatch")}</h3>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{t("map.clickMap")}</p>
            </div>
          </div>

          <div className="px-4 pb-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={inputLat} onChange={(e) => setInputLat(e.target.value)} placeholder="Lat" disabled={isActive}
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 disabled:opacity-40 transition-colors font-mono" />
              <input type="text" value={inputLng} onChange={(e) => setInputLng(e.target.value)} placeholder="Lng" disabled={isActive}
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 disabled:opacity-40 transition-colors font-mono" />
            </div>

            {/* Speed */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mr-1">{t("map.speed")}</span>
              {SPEED_OPTIONS.map((s) => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`flex-1 rounded-md px-1 py-1.5 text-[11px] font-semibold transition-all ${speed === s ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"}`}>
                  {s}×
                </button>
              ))}
            </div>

            <button onClick={launch} disabled={!canLaunch}
              className="w-full rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed">
              {isActive ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  {phaseLabel[phase]}
                </span>
              ) : t("map.launch")}
            </button>
          </div>

          {target && phase === "idle" && (
            <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L7 13M1 7L13 7" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span className="text-[11px] text-slate-400">{haversineKm(HQ, target).toFixed(1)} km {t("map.fromHQ")}</span>
            </div>
          )}

          {isActive && (
            <div className="mx-4 mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{phaseLabel[phase]}</span>
                <span className="text-[10px] text-slate-400 font-mono">{distKm.toFixed(1)} km</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-100 ${phaseColor[phase]}`} style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          )}

          {deliveries.length > 0 && (
            <div className="border-t border-white/[0.06] px-4 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{t("map.recent")}</p>
              <div className="max-h-[140px] space-y-1 overflow-y-auto pr-1">
                {deliveries.map((d) => (
                  <div key={d.id}
                    className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2 group hover:bg-white/[0.06] transition-colors cursor-pointer"
                    onClick={() => mapObj.current?.flyTo([d.lat, d.lng], 11)}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
                      <circle cx="5" cy="5" r="3.5" fill="#22C55E" stroke="white" strokeWidth="1"/>
                    </svg>
                    <span className="text-[11px] text-slate-400 font-mono truncate group-hover:text-slate-200 transition-colors">
                      {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
                    </span>
                    <span className="ml-auto text-[10px] text-slate-600 shrink-0">{d.dist.toFixed(0)}km</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Status Bar ─── */}
      {isActive && (
        <div className="absolute bottom-6 left-1/2 z-[1000] -translate-x-1/2">
          <div className="inline-flex items-center gap-3 rounded-full bg-slate-900/85 border border-white/[0.08] px-5 py-2.5 backdrop-blur-2xl shadow-2xl">
            <span className={`inline-block h-2 w-2 rounded-full ${phaseColor[phase]} ${phase === "delivering" ? "" : "animate-ping"}`} />
            <span className="text-xs font-medium text-white">{phaseLabel[phase]}</span>
            <span className="text-[10px] text-slate-500">·</span>
            <span className="text-[11px] text-slate-400 font-mono">{speed}×</span>
            <span className="text-[10px] text-slate-500">·</span>
            <span className="text-[11px] text-slate-400 font-mono">{(progress * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {phase === "complete" && (
        <div className="absolute bottom-6 left-1/2 z-[1000] -translate-x-1/2">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-600/90 border border-green-400/20 px-5 py-2.5 backdrop-blur-xl shadow-2xl">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" fill="white" fillOpacity="0.2"/>
              <path d="M4 7L6 9L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs font-semibold text-white">{t("map.complete")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
