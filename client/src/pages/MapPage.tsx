import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ─── Constants ─── */
const HQ: [number, number] = [40.7549, -73.984];
const SPEED_OPTIONS = [1, 2, 5, 10] as const;
const BASE_KM_PER_SEC = 1.4;
const DRONE_COUNT = 3;
const STAGGER_MS = 2200;

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

/* ─── Colors per drone ─── */
const DRONE_COLORS = [
  { main: "#3B82F6", bg: "bg-blue-500",   text: "text-blue-400",   glow: "rgba(59,130,246,0.4)" },
  { main: "#A855F7", bg: "bg-purple-500", text: "text-purple-400", glow: "rgba(168,85,247,0.4)" },
  { main: "#F59E0B", bg: "bg-amber-500",  text: "text-amber-400",  glow: "rgba(245,158,11,0.4)" },
];

/* ─── SVG Icon Builders ─── */
function droneSvg(color: string) {
  const id = color.replace("#", "");
  return `
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g filter="url(#ds${id})">
    <circle cx="18" cy="18" r="13" fill="${color}" stroke="white" stroke-width="2"/>
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
    <filter id="ds${id}" x="-2" y="-1" width="40" height="41" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.35"/>
    </filter>
  </defs>
</svg>`;
}

const hqSvg = `
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="17" fill="#0F172A" stroke="white" stroke-width="2.5"/>
  <path d="M13 27V19L20 14L27 19V27" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="18" y="23" width="4" height="4" rx="0.5" stroke="white" stroke-width="1.2" fill="none"/>
  <rect x="14.5" y="19.5" width="3" height="3" rx="0.5" fill="white" fill-opacity="0.3"/>
  <rect x="22.5" y="19.5" width="3" height="3" rx="0.5" fill="white" fill-opacity="0.3"/>
</svg>`;

const deliveredSvg = `
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="8" cy="8" r="5.5" fill="#22C55E" stroke="white" stroke-width="2"/>
  <path d="M5.5 8L7.2 9.7L10.5 6.3" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const smallDotSvg = `
<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
  <circle cx="5" cy="5" r="3.5" fill="#3B82F6" fill-opacity="0.25" stroke="white" stroke-width="0.8"/>
</svg>`;

function targetSvg(color: string) {
  return `
<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="14" cy="14" r="10" stroke="${color}" stroke-width="1.5" stroke-dasharray="3 2.5" fill="${color}" fill-opacity="0.06"/>
  <circle cx="14" cy="14" r="5" stroke="${color}" stroke-width="1.2" fill="${color}" fill-opacity="0.12"/>
  <circle cx="14" cy="14" r="2" fill="${color}"/>
</svg>`;
}

function mkIcon(html: string, size: number) {
  const a = size / 2;
  return L.divIcon({ html, className: "", iconSize: [size, size], iconAnchor: [a, a] });
}

const hqIcon = mkIcon(hqSvg, 40);
const deliveredIcon = mkIcon(deliveredSvg, 16);
const dotIcon = mkIcon(smallDotSvg, 10);

function droneIconFor(color: string, glow: string) {
  return mkIcon(`<div class="drone-marker" style="filter:drop-shadow(0 2px 6px ${glow})">${droneSvg(color)}</div>`, 36);
}

function targetIconFor(color: string) {
  return mkIcon(`<div class="target-marker">${targetSvg(color)}</div>`, 28);
}

/* ─── Types ─── */
type DronePhase = "idle" | "to-target" | "delivering" | "returning";

interface OrderTarget {
  id: string;
  lat: number;
  lng: number;
  county: string;
  total: number;
  originalId: number | null;
}

interface DroneState {
  idx: number;
  color: typeof DRONE_COLORS[number];
  phase: DronePhase;
  progress: number;
  target: OrderTarget | null;
  completedCount: number;
  totalDistKm: number;
}

interface CompletedDelivery {
  id: string;
  droneIdx: number;
  order: OrderTarget;
  distKm: number;
  ts: number;
}

/* ─── Bezier / Anim helpers ─── */
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

function trailPts(fn: (t: number) => [number, number], p: number) {
  const pts: [number, number][] = [];
  const n = Math.max(1, Math.floor(p * 120));
  for (let i = 0; i <= n; i++) pts.push(fn(i / 120));
  return pts;
}

/* ─── Component ─── */
export default function MapPage() {
  const { t } = useTranslation();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapObj = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);

  const ordersPool = useRef<OrderTarget[]>([]);
  const orderIdx = useRef(0);

  const droneMarkers = useRef<L.Marker[]>([]);
  const targetMarkers = useRef<(L.Marker | null)[]>([]);
  const trailsOut = useRef<L.Polyline[]>([]);
  const trailsBack = useRef<L.Polyline[]>([]);

  const droneAnims = useRef<{
    acc: number;
    lastT: number;
    bezOut: ((t: number) => [number, number]) | null;
    bezRet: ((t: number) => [number, number]) | null;
    baseDurMs: number;
    distKm: number;
    rafId: number | null;
  }[]>([]);

  const [speed, setSpeed] = useState<number>(2);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);

  const [drones, setDrones] = useState<DroneState[]>(() =>
    DRONE_COLORS.slice(0, DRONE_COUNT).map((c, i) => ({
      idx: i, color: c, phase: "idle" as DronePhase, progress: 0, target: null, completedCount: 0, totalDistKm: 0,
    }))
  );
  const dronesRef = useRef(drones);
  dronesRef.current = drones;

  const [completed, setCompleted] = useState<CompletedDelivery[]>([]);
  const [totalDelivered, setTotalDelivered] = useState(0);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  const updateDrone = useCallback((idx: number, patch: Partial<DroneState>) => {
    setDrones((prev) => prev.map((d) => (d.idx === idx ? { ...d, ...patch } : d)));
  }, []);

  const nextOrder = useCallback((): OrderTarget | null => {
    const pool = ordersPool.current;
    if (pool.length === 0) return null;
    const o = pool[orderIdx.current % pool.length];
    orderIdx.current++;
    return o;
  }, []);

  /* ─── Init map ─── */
  useEffect(() => {
    if (!mapEl.current || mapObj.current) return;

    const m = L.map(mapEl.current, {
      center: [41.5, -74.8],
      zoom: 8,
      zoomControl: false,
      minZoom: 6,
      maxZoom: 18,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
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
          <span style="font-size:11px;color:#94a3b8">Drone Operations Center</span><br/>
          <span style="font-size:10px;color:#64748b">Manhattan, NY</span>
        </div>`
      );

    const lg = L.layerGroup().addTo(m);
    layersRef.current = lg;

    const dm: L.Marker[] = [];
    const tm: (L.Marker | null)[] = [];
    const tO: L.Polyline[] = [];
    const tB: L.Polyline[] = [];
    const da: typeof droneAnims.current = [];

    for (let i = 0; i < DRONE_COUNT; i++) {
      const c = DRONE_COLORS[i];
      dm.push(L.marker(HQ, { icon: droneIconFor(c.main, c.glow), opacity: 0, zIndexOffset: 1000 + i }).addTo(m));
      tm.push(null);
      tO.push(L.polyline([], { color: c.main, weight: 2.5, opacity: 0.6, dashArray: "8 6" }).addTo(m));
      tB.push(L.polyline([], { color: c.main, weight: 2, opacity: 0.35, dashArray: "6 8" }).addTo(m));
      da.push({ acc: 0, lastT: 0, bezOut: null, bezRet: null, baseDurMs: 0, distKm: 0, rafId: null });
    }

    droneMarkers.current = dm;
    targetMarkers.current = tm;
    trailsOut.current = tO;
    trailsBack.current = tB;
    droneAnims.current = da;

    mapObj.current = m;
    loadOrders(lg);

    return () => {
      for (const a of droneAnims.current) {
        if (a.rafId) cancelAnimationFrame(a.rafId);
      }
      m.remove();
      mapObj.current = null;
    };
  }, []);

  /* ─── Load orders from API ─── */
  const loadOrders = async (layer: L.LayerGroup) => {
    try {
      const res = await fetch("/orders?limit=100&sortOrder=desc");
      const data = await res.json();
      if (data?.data) {
        const pool: OrderTarget[] = [];
        for (const o of data.data) {
          const lat = o.latitude;
          const lng = o.longitude;
          pool.push({
            id: o.id,
            lat,
            lng,
            county: o.jurisdictions?.county || "NY",
            total: Number(o.totalAmount),
            originalId: o.originalId,
          });
          L.marker([lat, lng], { icon: dotIcon, opacity: 0.35 })
            .addTo(layer)
            .bindPopup(
              `<div style="font-family:system-ui;font-size:11px;padding:2px 0">
                <strong>#${o.originalId ?? o.id.slice(0, 6)}</strong> · ${o.jurisdictions?.county || "NY"}<br/>
                $${Number(o.totalAmount).toFixed(2)}
              </div>`
            );
        }
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        ordersPool.current = pool;
        setOrdersLoaded(true);
      }
    } catch {
      /* silent */
    }
  };

  /* ─── Launch a single drone mission ─── */
  const launchDrone = useCallback((idx: number) => {
    const order = nextOrder();
    if (!order || !mapObj.current) return;

    const dest: [number, number] = [order.lat, order.lng];
    const dist = haversineKm(HQ, dest);
    const baseDurMs = Math.max(3000, (dist / BASE_KM_PER_SEC) * 1000);
    const c = DRONE_COLORS[idx];

    updateDrone(idx, { phase: "to-target", progress: 0, target: order });

    if (targetMarkers.current[idx]) {
      targetMarkers.current[idx]!.setLatLng(dest).setOpacity(1);
    } else if (mapObj.current) {
      targetMarkers.current[idx] = L.marker(dest, { icon: targetIconFor(c.main), zIndexOffset: 900 }).addTo(mapObj.current);
    }

    const dm = droneMarkers.current[idx];
    const tO = trailsOut.current[idx];
    const tB = trailsBack.current[idx];
    const anim = droneAnims.current[idx];

    dm.setLatLng(HQ).setOpacity(1);
    tO.setLatLngs([]);
    tB.setLatLngs([]);

    anim.bezOut = makeBezier(HQ, dest, 0.1 + idx * 0.03);
    anim.bezRet = makeBezier(dest, HQ, 0.06 + idx * 0.02);
    anim.baseDurMs = baseDurMs;
    anim.distKm = dist;
    anim.acc = 0;
    anim.lastT = performance.now();

    const flyOut = (now: number) => {
      if (!runningRef.current) { anim.rafId = null; return; }
      const dt = now - anim.lastT;
      anim.lastT = now;
      anim.acc += (dt / anim.baseDurMs) * speedRef.current;
      const p = Math.min(anim.acc, 1);
      updateDrone(idx, { progress: p });

      const e = ease(p);
      dm.setLatLng(anim.bezOut!(e));
      tO.setLatLngs(trailPts(anim.bezOut!, e));

      if (p < 1) {
        anim.rafId = requestAnimationFrame(flyOut);
      } else {
        updateDrone(idx, { phase: "delivering", progress: 1 });

        if (targetMarkers.current[idx]) {
          targetMarkers.current[idx]!.setOpacity(0);
        }

        if (layersRef.current) {
          L.marker(dest, { icon: deliveredIcon }).addTo(layersRef.current).bindPopup(
            `<div style="font-family:system-ui;font-size:11px;padding:2px 0">
              <strong>#${order.originalId ?? order.id.slice(0, 6)}</strong><br/>
              <span style="color:#94a3b8">${order.county}</span> · $${order.total.toFixed(2)}<br/>
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
            if (r > 30) { clearInterval(pi); mapObj.current?.removeLayer(pulse); }
          }, 25);
        }

        setCompleted((prev) => [
          { id: `${idx}-${Date.now()}`, droneIdx: idx, order, distKm: dist, ts: Date.now() },
          ...prev.slice(0, 19),
        ]);
        setTotalDelivered((n) => n + 1);

        const pause = Math.max(400, 1200 / speedRef.current);
        setTimeout(() => {
          if (!runningRef.current) return;
          updateDrone(idx, { phase: "returning", progress: 0 });
          anim.acc = 0;
          anim.lastT = performance.now();
          anim.rafId = requestAnimationFrame(flyBack);
        }, pause);
      }
    };

    const flyBack = (now: number) => {
      if (!runningRef.current) { anim.rafId = null; return; }
      const dt = now - anim.lastT;
      anim.lastT = now;
      anim.acc += (dt / anim.baseDurMs) * speedRef.current;
      const p = Math.min(anim.acc, 1);
      updateDrone(idx, { progress: p });

      const e = ease(p);
      dm.setLatLng(anim.bezRet!(e));
      tB.setLatLngs(trailPts(anim.bezRet!, e));

      if (p < 1) {
        anim.rafId = requestAnimationFrame(flyBack);
      } else {
        dm.setOpacity(0);
        tO.setLatLngs([]);
        tB.setLatLngs([]);
        updateDrone(idx, {
          phase: "idle", progress: 0, target: null,
          completedCount: (dronesRef.current[idx]?.completedCount ?? 0) + 1,
          totalDistKm: (dronesRef.current[idx]?.totalDistKm ?? 0) + anim.distKm,
        });

        const nextDelay = Math.max(300, 800 / speedRef.current);
        setTimeout(() => {
          if (runningRef.current) launchDrone(idx);
        }, nextDelay);
      }
    };

    anim.rafId = requestAnimationFrame(flyOut);
  }, [nextOrder, updateDrone]);

  /* ─── Start / Stop ─── */
  const startOps = useCallback(() => {
    if (ordersPool.current.length === 0) return;
    setRunning(true);
    runningRef.current = true;
    for (let i = 0; i < DRONE_COUNT; i++) {
      setTimeout(() => {
        if (runningRef.current) launchDrone(i);
      }, i * STAGGER_MS);
    }
  }, [launchDrone]);

  const stopOps = useCallback(() => {
    setRunning(false);
    runningRef.current = false;
    for (let i = 0; i < DRONE_COUNT; i++) {
      const a = droneAnims.current[i];
      if (a.rafId) { cancelAnimationFrame(a.rafId); a.rafId = null; }
      droneMarkers.current[i]?.setOpacity(0);
      trailsOut.current[i]?.setLatLngs([]);
      trailsBack.current[i]?.setLatLngs([]);
      if (targetMarkers.current[i]) targetMarkers.current[i]!.setOpacity(0);
    }
    setDrones((prev) =>
      prev.map((d) => ({ ...d, phase: "idle" as DronePhase, progress: 0, target: null }))
    );
  }, []);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      for (const a of droneAnims.current) {
        if (a.rafId) cancelAnimationFrame(a.rafId);
      }
    };
  }, []);

  /* ─── Derived ─── */
  const activeDrones = drones.filter((d) => d.phase !== "idle").length;
  const totalDist = drones.reduce((s, d) => s + d.totalDistKm, 0);

  const phaseLabel = (p: DronePhase): string => {
    switch (p) {
      case "to-target": return t("map.toTarget");
      case "delivering": return t("map.delivering");
      case "returning": return t("map.returning");
      default: return t("map.waiting");
    }
  };

  /* ─── Render ─── */
  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 3.5rem)" }}>
      <style>{`
        .drone-marker { animation: drone-bob 2s ease-in-out infinite; }
        @keyframes drone-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        .target-marker { animation: target-spin 8s linear infinite; }
        @keyframes target-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .leaflet-container { background: #0f172a !important; }
      `}</style>

      <div ref={mapEl} className="absolute inset-0" />

      {/* ─── Operations Panel ─── */}
      <div className="absolute left-4 top-4 z-[1000] w-[300px]">
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/90 backdrop-blur-2xl shadow-2xl overflow-hidden">
          {/* Header */}
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
              <h3 className="text-[13px] font-semibold text-white leading-tight">{t("map.operations")}</h3>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{t("map.opsSubtitle")}</p>
            </div>
          </div>

          {/* Speed */}
          <div className="px-4 pb-3 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mr-1">{t("map.speed")}</span>
              {SPEED_OPTIONS.map((s) => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`flex-1 rounded-md px-1 py-1.5 text-[11px] font-semibold transition-all ${speed === s ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"}`}>
                  {s}×
                </button>
              ))}
            </div>

            {!running ? (
              <button onClick={startOps} disabled={!ordersLoaded}
                className="w-full rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 2.5L12 7L3 11.5V2.5Z" fill="currentColor"/>
                </svg>
                {ordersLoaded ? t("map.startOps") : t("common.loading")}
              </button>
            ) : (
              <button onClick={stopOps}
                className="w-full rounded-lg bg-red-600/80 px-3 py-2.5 text-xs font-semibold text-white transition-all hover:bg-red-500 active:scale-[0.98] flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="3" y="3" width="8" height="8" rx="1" fill="currentColor"/>
                </svg>
                {t("map.stopOps")}
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="mx-4 mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-white/[0.04] px-2 py-2 text-center">
              <p className="text-sm font-bold text-white">{totalDelivered}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider">{t("map.delivered")}</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] px-2 py-2 text-center">
              <p className="text-sm font-bold text-white">{activeDrones}/{DRONE_COUNT}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider">{t("map.active")}</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] px-2 py-2 text-center">
              <p className="text-sm font-bold text-white">{totalDist.toFixed(0)}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider">km</p>
            </div>
          </div>

          {/* Fleet status */}
          {running && (
            <div className="border-t border-white/[0.06] px-4 py-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">{t("map.fleet")}</p>
              {drones.map((d) => (
                <div key={d.idx} className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] px-2.5 py-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${d.color.bg} ${d.phase !== "idle" ? "animate-pulse" : "opacity-40"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-300">
                        {t("map.drone")} {d.idx + 1}
                      </span>
                      <span className={`text-[10px] font-medium ${d.phase !== "idle" ? d.color.text : "text-slate-600"}`}>
                        {d.phase !== "idle" ? phaseLabel(d.phase) : t("map.waiting")}
                      </span>
                    </div>
                    {d.phase !== "idle" && (
                      <div className="mt-1 h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className={`h-full rounded-full ${d.color.bg} transition-all duration-100`} style={{ width: `${d.progress * 100}%` }} />
                      </div>
                    )}
                    {d.target && d.phase !== "idle" && (
                      <p className="text-[9px] text-slate-500 mt-0.5 truncate">
                        → #{d.target.originalId ?? d.target.id.slice(0, 6)} · {d.target.county}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent deliveries */}
          {completed.length > 0 && (
            <div className="border-t border-white/[0.06] px-4 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{t("map.recent")}</p>
              <div className="max-h-[150px] space-y-1 overflow-y-auto pr-1">
                {completed.slice(0, 10).map((d) => (
                  <div key={d.id}
                    className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5 group hover:bg-white/[0.06] transition-colors cursor-pointer"
                    onClick={() => mapObj.current?.flyTo([d.order.lat, d.order.lng], 11)}>
                    <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${DRONE_COLORS[d.droneIdx].bg}`} />
                    <span className="text-[10px] text-slate-400 truncate group-hover:text-slate-200 transition-colors">
                      #{d.order.originalId ?? d.order.id.slice(0, 6)} · {d.order.county}
                    </span>
                    <span className="ml-auto text-[9px] text-slate-600 shrink-0">{d.distKm.toFixed(0)}km</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Bottom Status Bar ─── */}
      {running && (
        <div className="absolute bottom-6 left-1/2 z-[1000] -translate-x-1/2">
          <div className="inline-flex items-center gap-4 rounded-full bg-slate-900/85 border border-white/[0.08] px-5 py-2.5 backdrop-blur-2xl shadow-2xl">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-white">{t("map.liveOps")}</span>
            <span className="text-[10px] text-slate-500">·</span>
            <span className="text-[11px] text-slate-400 font-mono">{speed}×</span>
            <span className="text-[10px] text-slate-500">·</span>
            <div className="flex items-center gap-1.5">
              {drones.map((d) => (
                <div key={d.idx}
                  className={`h-2.5 w-2.5 rounded-full border ${d.phase !== "idle"
                    ? `${d.color.bg} border-white/20`
                    : "bg-slate-700 border-slate-600"
                  }`}
                  title={`Drone ${d.idx + 1}: ${d.phase}`} />
              ))}
            </div>
            <span className="text-[10px] text-slate-500">·</span>
            <span className="text-[11px] text-slate-400 font-mono">{totalDelivered} {t("map.delivered").toLowerCase()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
