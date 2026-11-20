// ==================== 地图源配置 ====================
// 每个地图源可配置坐标系统、是否需要 Key、图层等。
// coordSystem: "wgs84" 表示与 GPS/WGS-84 一致；"gcj02" 表示火星坐标（腾讯/国内偏移）。
const MAP_SOURCES = [
  {
    id: "tianditu",
    name: "天地图（国内）",
    coordSystem: "wgs84",
    requiresKey: true,
    keyLabel: "天地图 Key",
    keyHint: "在 tianditu.gov.cn 申请，留空则无法加载",
    defaultKey: "f89d3968c268cf6a549c6c6bc337e19e",
    chinaOnly: true,
    layers: [
      {
        url: "https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={key}",
        subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
        minZoom: 5,
        maxZoom: 20,
        maxNativeZoom: 18,
        attribution: "© 天地图 GS (2025) 1508号"
      },
      {
        url: "https://t{s}.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={key}",
        subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
        minZoom: 5,
        maxZoom: 20,
        maxNativeZoom: 17
      }
    ]
  },
  {
    id: "osm",
    name: "OpenStreetMap（国际）",
    coordSystem: "wgs84",
    requiresKey: false,
    chinaOnly: false,
    layers: [
      {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        subdomains: ["a", "b", "c"],
        minZoom: 1,
        maxZoom: 19,
        maxNativeZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }
    ]
  },
  {
    id: "google",
    name: "Google 地图（标准）",
    coordSystem: "wgs84",
    requiresKey: false,
    keyLabel: "Google API Key（可选）",
    keyHint: "中国大陆区域 Google 数据有偏移，可勾选下方纠偏",
    chinaOnly: false,
    layers: [
      {
        url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}{key}",
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        minZoom: 1,
        maxZoom: 20,
        maxNativeZoom: 20,
        attribution: "&copy; Google"
      }
    ]
  },
  {
    id: "google_sat",
    name: "Google 卫星（混合）",
    coordSystem: "wgs84",
    requiresKey: false,
    keyLabel: "Google API Key（可选）",
    keyHint: "中国大陆区域 Google 数据有偏移，可勾选下方纠偏",
    chinaOnly: false,
    layers: [
      {
        url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}{key}",
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        minZoom: 1,
        maxZoom: 20,
        maxNativeZoom: 20,
        attribution: "&copy; Google"
      }
    ]
  },
  {
    id: "tencent",
    name: "腾讯地图",
    coordSystem: "gcj02",
    requiresKey: false,
    keyLabel: "腾讯地图 Key（可选）",
    keyHint: "腾讯为火星坐标，默认已勾选纠偏",
    chinaOnly: true,
    layers: [
      {
        url: "https://rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={y}&styleid=1&version=117{key}",
        subdomains: ["0", "1", "2", "3"],
        minZoom: 3,
        maxZoom: 20,
        maxNativeZoom: 18,
        tms: true,
        attribution: "&copy; 腾讯地图"
      }
    ]
  }
];

// ==================== 地图初始化 ====================
const chinaBounds = L.latLngBounds(
  L.latLng(3.86, 73.66),
  L.latLng(53.55, 135.05)
);
const worldBounds = L.latLngBounds(
  L.latLng(-85, -180),
  L.latLng(85, 180)
);

const map = L.map("map", {
  attributionControl: true,
  maxBoundsViscosity: 1.0 // 1.0 = 硬边界
}).setView([26.083719, 119.246678], 13);

// ==================== 坐标转换（GCJ-02 <-> WGS-84） ====================
const GCJ_A = 6378245.0;
const GCJ_EE = 0.00669342162296594323;

function outOfChina(lat, lng) {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transformLat(x, y) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin((y / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((y / 12.0) * Math.PI) + 320.0 * Math.sin((y * Math.PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLng(x, y) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin((x / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((x / 12.0) * Math.PI) + 300.0 * Math.sin((x / 30.0) * Math.PI)) * 2.0) / 3.0;
  return ret;
}

function gcj02Delta(lat, lng) {
  if (outOfChina(lat, lng)) return { dLat: 0, dLng: 0 };
  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - GCJ_EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((GCJ_A * (1 - GCJ_EE)) / (magic * sqrtMagic)) * Math.PI);
  dLng = (dLng * 180.0) / ((GCJ_A / sqrtMagic) * Math.cos(radLat) * Math.PI);
  return { dLat, dLng };
}

function gcj02ToWgs84(lat, lng) {
  const d = gcj02Delta(lat, lng);
  return { lat: lat - d.dLat, lng: lng - d.dLng };
}

function wgs84ToGcj02(lat, lng) {
  const d = gcj02Delta(lat, lng);
  return { lat: lat + d.dLat, lng: lng + d.dLng };
}

// ==================== 地图源切换 ====================
let currentLayers = [];
let currentSourceId = "tianditu";
let coordConvertEnabled = false;

// 轨迹与预览状态
// 路线分成三段：main（主路线，所有中间圈都用它）、first（首圈）、last（尾圈）
// 首圈 / 尾圈是可选的，用来模拟起点终点不在同一个位置的真实跑步轨迹。
const SEGMENT_KEYS = ["main", "first", "last"];
const SEGMENT_LABELS = { main: "主路线", first: "首圈", last: "尾圈" };
const SEGMENT_COLORS = { main: "#ff5722", first: "#16a34a", last: "#2563eb" };
const segments = { main: [], first: [], last: [] };
const segmentEnabled = { first: false, last: false };
const polylines = { main: null, first: null, last: null };
let activeSegment = "main";

let routeMode = "loop"; // "loop" 环形（自动闭合）/ "linear" 线性（不闭合）
let previewData = null;
let previewTimer = null;
let previewIndex = 0;
let previewMarker = null;
let previewTrace = null;

// 路线编辑状态：撤回栈 / 结点标记 / 拖动状态
const HISTORY_LIMIT = 80;
const undoStack = [];
const redoStack = [];
let vertexMarkers = [];
let dragSnapshot = null;
let isDraggingRoute = false;
let isDraggingVertex = false;
// 平移结束后浏览器还会补发一次 click，用它把这一个 click 吞掉，避免多加点
let suppressMapClickUntil = 0;

const mapSourceSelect = document.getElementById("mapSource");
const mapKeyGroup = document.getElementById("mapKeyGroup");
const mapKeyLabel = document.getElementById("mapKeyLabel");
const mapKeyInput = document.getElementById("mapKeyInput");
const coordConvertCheckbox = document.getElementById("coordConvert");

function getSourceById(id) {
  return MAP_SOURCES.find((s) => s.id === id) || MAP_SOURCES[0];
}

function getCurrentSource() {
  return getSourceById(currentSourceId);
}

function getKeyStorageKey(id) {
  return "fit_mapkey_" + id;
}

function getConvertStorageKey(id) {
  return "fit_mapconvert_" + id;
}

function buildLayerUrl(source, template, key) {
  const encoded = encodeURIComponent(key || "");
  if (source.requiresKey) {
    return template.replace("{key}", encoded);
  }
  return template.replace("{key}", key ? "&key=" + encoded : "");
}

function clearPreviewOverlay() {
  if (previewMarker) {
    map.removeLayer(previewMarker);
    previewMarker = null;
  }
  if (previewTrace) {
    map.removeLayer(previewTrace);
    previewTrace = null;
  }
  if (previewTimer) {
    clearInterval(previewTimer);
    previewTimer = null;
  }
  previewData = null;
  previewIndex = 0;
}

function clearRoute(options) {
  const opts = options || {};
  const hasAny = SEGMENT_KEYS.some((key) => segments[key].length > 0);
  if (opts.recordHistory !== false && hasAny) {
    pushHistory();
  }
  SEGMENT_KEYS.forEach((key) => {
    segments[key] = [];
  });
  segmentEnabled.first = false;
  segmentEnabled.last = false;
  activeSegment = "main";
  removeAllVertices();
  SEGMENT_KEYS.forEach((key) => {
    if (polylines[key]) {
      map.removeLayer(polylines[key]);
      polylines[key] = null;
    }
  });
  clearPreviewOverlay();
  syncSegmentUi();
  updateDistanceInfo();
  updateHistoryButtons();
}

function applySource(id) {
  const source = getSourceById(id);
  currentSourceId = source.id;

  // 移除旧图层
  currentLayers.forEach((layer) => map.removeLayer(layer));
  currentLayers = [];

  // 边界限制
  map.setMaxBounds(source.chinaOnly ? chinaBounds : worldBounds);

  // 图源版权
  if (source.id === "tianditu") {
    map.attributionControl.setPrefix(
      '<div style="text-align: right; margin-bottom: 4px;">' +
        '<a href="https://www.tianditu.gov.cn" target="_blank" style="display: inline-block; line-height: 0;">' +
        '<img src="https://www.tianditu.gov.cn/assets/logo-Tuu47PEg.svg" alt="天地图" style="height: 60px;">' +
        "</a></div>"
    );
  } else {
    map.attributionControl.setPrefix("");
  }

  // 创建图层
  const key = localStorage.getItem(getKeyStorageKey(source.id));
  const effectiveKey =
    key !== null ? key : source.defaultKey !== undefined ? source.defaultKey : "";
  source.layers.forEach((layerDef) => {
    const layer = L.tileLayer(buildLayerUrl(source, layerDef.url, effectiveKey), {
      subdomains: layerDef.subdomains,
      minZoom: layerDef.minZoom,
      maxZoom: layerDef.maxZoom,
      maxNativeZoom: layerDef.maxNativeZoom,
      tms: layerDef.tms,
      attribution: layerDef.attribution
    }).addTo(map);
    currentLayers.push(layer);
  });

  // Key 输入框
  if (source.keyLabel) {
    mapKeyGroup.style.display = "";
    mapKeyLabel.textContent = source.keyLabel;
    mapKeyInput.placeholder = source.keyHint || "输入 API Key";
    mapKeyInput.value = effectiveKey;
  } else {
    mapKeyGroup.style.display = "none";
  }

  // 坐标纠偏
  const storedConvert = localStorage.getItem(getConvertStorageKey(source.id));
  coordConvertEnabled =
    storedConvert !== null
      ? storedConvert === "1"
      : source.coordSystem === "gcj02";
  coordConvertCheckbox.checked = coordConvertEnabled;

  // 切换图源后清除轨迹，避免坐标系混乱
  clearRoute();
  updateMessage(`已切换到：${source.name}`);
}

// 前端坐标系统下计算（显示用）
function toMapCoords(lat, lng) {
  return coordConvertEnabled ? wgs84ToGcj02(lat, lng) : { lat, lng };
}

// 把某一段的坐标转换到 WGS-84（生成 FIT / 预览用）
function convertPointsToWgs84(points) {
  if (!coordConvertEnabled) return points.map((p) => ({ lat: p.lat, lng: p.lng }));
  return points.map((p) => gcj02ToWgs84(p.lat, p.lng));
}

// 初始化地图源下拉框
MAP_SOURCES.forEach((source) => {
  const opt = document.createElement("option");
  opt.value = source.id;
  opt.textContent = source.name;
  mapSourceSelect.appendChild(opt);
});

mapSourceSelect.addEventListener("change", () => {
  applySource(mapSourceSelect.value);
});

mapKeyInput.addEventListener("change", () => {
  const source = getCurrentSource();
  localStorage.setItem(getKeyStorageKey(source.id), mapKeyInput.value.trim());
  applySource(source.id); // 用新 Key 重建图层
});

coordConvertCheckbox.addEventListener("change", () => {
  const source = getCurrentSource();
  coordConvertEnabled = coordConvertCheckbox.checked;
  localStorage.setItem(
    getConvertStorageKey(source.id),
    coordConvertEnabled ? "1" : "0"
  );
});

// 恢复上次使用的地图源
const savedSourceId = localStorage.getItem("fit_mapsource");
applySource(savedSourceId && getSourceById(savedSourceId) ? savedSourceId : "tianditu");
mapSourceSelect.value = currentSourceId;

mapSourceSelect.addEventListener("change", () => {
  localStorage.setItem("fit_mapsource", currentSourceId);
});

// ==================== 定位功能 ====================
let currentLocationMarker = null;
const USE_TEST_LOCATION = false; // true = 测试模式，false = 真实定位

const getLocationBtn = document.getElementById("getLocationBtn");
if (getLocationBtn) {
  getLocationBtn.addEventListener("click", () => {
    getLocationBtn.disabled = true;
    getLocationBtn.textContent = "定位中...";
    updateMessage("正在获取您的位置...");

    if (USE_TEST_LOCATION) {
      // 测试模式
      setTimeout(() => {
        const lat = 39.90513;
        const lng = 116.122225;
        const accuracy = 114514;

        if (currentLocationMarker) {
          map.removeLayer(currentLocationMarker);
        }

        const pos = toMapCoords(lat, lng);
        currentLocationMarker = L.marker([pos.lat, pos.lng], {
          icon: L.divIcon({
            className: "current-location-marker",
            html: '<div class="location-pulse"></div>',
            iconSize: [20, 20]
          })
        }).addTo(map);

        currentLocationMarker
          .bindPopup(
            `<b>当前位置（若想获取真实位置请退出测试模式）</b><br>` +
              `纬度: ${lat.toFixed(6)}<br>` +
              `经度: ${lng.toFixed(6)}<br>` +
              `精度: ±${accuracy}米`
          )
          .openPopup();

        map.setView([pos.lat, pos.lng], 15);

        getLocationBtn.disabled = false;
        getLocationBtn.textContent = "尝试获取当前位置";
        updateMessage(`定位成功！精度约 ${accuracy} 米（测试模式）`);
      }, 500);
    } else {
      if (!navigator.geolocation) {
        updateMessage("您的浏览器不支持定位功能", true);
        getLocationBtn.disabled = false;
        getLocationBtn.textContent = "尝试获取当前位置";
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;

          if (currentLocationMarker) {
            map.removeLayer(currentLocationMarker);
          }

          const pos = toMapCoords(lat, lng);
          currentLocationMarker = L.marker([pos.lat, pos.lng], {
            icon: L.divIcon({
              className: "current-location-marker",
              html: '<div class="location-pulse"></div>',
              iconSize: [20, 20]
            })
          }).addTo(map);

          currentLocationMarker
            .bindPopup(
              `<b>您的当前位置</b><br>` +
                `纬度: ${lat.toFixed(6)}<br>` +
                `经度: ${lng.toFixed(6)}<br>` +
                `精度: ±${accuracy.toFixed(0)}米`
            )
            .openPopup();

          map.setView([pos.lat, pos.lng], 15);

          getLocationBtn.disabled = false;
          getLocationBtn.textContent = "尝试获取当前位置";
          updateMessage(`定位成功！精度约 ${accuracy.toFixed(0)} 米`);
        },
        (error) => {
          let errorMsg = "定位失败，请手动选择";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = "定位失败：您拒绝了位置权限请求";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = "定位失败：位置信息不可用";
              break;
            case error.TIMEOUT:
              errorMsg = "定位失败：请求超时";
              break;
          }
          updateMessage(errorMsg, true);
          alert(errorMsg + "\n\n请在地图上手动点击选择您的位置");
          getLocationBtn.disabled = false;
          getLocationBtn.textContent = "尝试获取当前位置";
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  });
}

// ==================== 体重存储 ====================
const weightInput = document.getElementById("weightInput");
const savedWeight = localStorage.getItem("fit_weight");
weightInput.value = savedWeight ? savedWeight : 65;
weightInput.addEventListener("change", () => {
  localStorage.setItem("fit_weight", weightInput.value);
});

function getWeightKg() {
  return Number(weightInput.value) || 65;
}

// ==================== 路线偏移（可调） ====================
// 偏移量 = 实际轨迹相对绘制路线的随机摆动幅度（米）。
// 0 表示完全贴合绘制路线；数值越大，轨迹越"飘"。
const ROUTE_OFFSET_MAX = 12;

const routeOffsetInput = document.getElementById("routeOffset");
const routeOffsetValueEl = document.getElementById("routeOffsetValue");

function clampRouteOffset(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 3;
  return Math.min(ROUTE_OFFSET_MAX, Math.max(0, n));
}

function getRouteOffset() {
  if (!routeOffsetInput) return 3;
  return clampRouteOffset(routeOffsetInput.value);
}

function syncRouteOffsetLabel() {
  if (!routeOffsetValueEl) return;
  const v = getRouteOffset();
  routeOffsetValueEl.textContent = v === 0 ? "0.0 米（完全贴合）" : `${v.toFixed(1)} 米`;
}

if (routeOffsetInput) {
  const savedOffset = localStorage.getItem("fit_routeoffset");
  if (savedOffset !== null && savedOffset !== "") {
    routeOffsetInput.value = String(clampRouteOffset(savedOffset));
  }
  routeOffsetInput.addEventListener("input", () => {
    syncRouteOffsetLabel();
    localStorage.setItem("fit_routeoffset", String(getRouteOffset()));
  });
  syncRouteOffsetLabel();
}

// ==================== 轨迹绘制 ====================
function updateMessage(text, isError = false) {
  const el = document.getElementById("message");
  el.textContent = text || "";
  el.className = "message" + (isError ? " error" : "");
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function computeDistanceMeters(points) {
  if (!points || points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng
    );
  }
  return total;
}

// 与服务端一致的「闭合路线」逻辑，避免显示距离比实际少一段
function closedRoutePoints(points) {
  if (!points || points.length < 2) return points || [];
  const first = points[0];
  const last = points[points.length - 1];
  const d = haversineDistance(first.lat, first.lng, last.lat, last.lng);
  if (d < 5) return points;
  return points.concat([{ lat: first.lat, lng: first.lng }]);
}

// 环形模式：首尾自动相连（闭合）；线性模式：保持原始路线
function segmentDisplayPoints(segmentKey) {
  const points = segments[segmentKey];
  return routeMode === "loop" ? closedRoutePoints(points) : points;
}

// 线性模式固定 1 圈；环形模式读取圈数输入
function getLapCount() {
  if (routeMode !== "loop") return 1;
  const lapInput = document.getElementById("lapCount");
  return Math.max(1, parseInt(lapInput && lapInput.value, 10) || 1);
}

// 某个分段是否可用：主路线有 2 个点即可；首圈/尾圈还需要勾选启用
function segmentUsable(segmentKey) {
  if (segments[segmentKey].length < 2) return false;
  if (segmentKey === "main") return true;
  return Boolean(segmentEnabled[segmentKey]);
}

function segmentDistanceMeters(segmentKey) {
  const points = segments[segmentKey];
  if (points.length < 2) return 0;
  if (routeMode === "loop") return computeDistanceMeters(closedRoutePoints(points));
  return computeDistanceMeters(points);
}

// 多圈总距离：首圈 / 尾圈各替换掉一圈，其余圈用主路线
function computeTotalDistanceMeters() {
  const laps = getLapCount();
  const mainMeters = segmentDistanceMeters("main");
  if (routeMode !== "loop" || laps <= 1) return mainMeters;
  const useFirst = segmentUsable("first");
  const useLast = segmentUsable("last");
  const customLaps = (useFirst ? 1 : 0) + (useLast ? 1 : 0);
  const middleLaps = Math.max(0, laps - customLaps);
  let total = mainMeters * middleLaps;
  if (useFirst) total += segmentDistanceMeters("first");
  if (useLast) total += segmentDistanceMeters("last");
  return total;
}

function updateDistanceInfo() {
  const el = document.getElementById("distanceInfo");
  if (!el) return;
  const laps = getLapCount();
  const mainMeters = segmentDistanceMeters("main");
  if (!segments.main.length || mainMeters <= 0) {
    el.textContent = "总距离约：0 公里";
    return;
  }
  const totalKm = (computeTotalDistanceMeters() / 1000).toFixed(2);
  if (routeMode === "loop" && laps > 1) {
    const useFirst = segmentUsable("first");
    const useLast = segmentUsable("last");
    const customLaps = (useFirst ? 1 : 0) + (useLast ? 1 : 0);
    const middle = Math.max(0, laps - customLaps);
    const parts = [];
    if (middle > 0) parts.push(`主路线 ${(mainMeters / 1000).toFixed(2)} × ${middle} 圈`);
    if (useFirst) parts.push(`首圈 ${(segmentDistanceMeters("first") / 1000).toFixed(2)}`);
    if (useLast) parts.push(`尾圈 ${(segmentDistanceMeters("last") / 1000).toFixed(2)}`);
    el.textContent = `总距离约：${totalKm} 公里（${parts.join(" + ")}）`;
  } else {
    el.textContent = `总距离约：${totalKm} 公里`;
  }
}

// ==================== 路线编辑：分段 / 撤回 / 结点拖动 / 整体平移 / 导入导出 ====================
function clonePoints(points) {
  return (points || []).map((p) => ({ lat: p.lat, lng: p.lng }));
}

function clampLat(value) {
  return Math.max(-85, Math.min(85, value));
}

function clampLng(value) {
  return Math.max(-180, Math.min(180, value));
}

function clampPoint(point) {
  return { lat: clampLat(Number(point.lat)), lng: clampLng(Number(point.lng)) };
}

function samePoints(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i].lat - b[i].lat) > 1e-9) return false;
    if (Math.abs(a[i].lng - b[i].lng) > 1e-9) return false;
  }
  return true;
}

// ---------- 撤回栈（快照：三段路线 + 启用状态；不记录当前编辑段，避免撤回时跳标签） ----------
function snapshotState() {
  return {
    enabled: { first: Boolean(segmentEnabled.first), last: Boolean(segmentEnabled.last) },
    points: {
      main: clonePoints(segments.main),
      first: clonePoints(segments.first),
      last: clonePoints(segments.last)
    }
  };
}

function statesEqual(a, b) {
  if (!a || !b) return false;
  return (
    a.enabled.first === b.enabled.first &&
    a.enabled.last === b.enabled.last &&
    samePoints(a.points.main, b.points.main) &&
    samePoints(a.points.first, b.points.first) &&
    samePoints(a.points.last, b.points.last)
  );
}

function applySnapshot(snap) {
  segments.main = clonePoints(snap.points.main);
  segments.first = clonePoints(snap.points.first);
  segments.last = clonePoints(snap.points.last);
  segmentEnabled.first = Boolean(snap.enabled.first);
  segmentEnabled.last = Boolean(snap.enabled.last);
}

function updateHistoryButtons() {
  const undoButton = document.getElementById("undoBtn");
  const redoButton = document.getElementById("redoBtn");
  if (undoButton) undoButton.disabled = undoStack.length === 0;
  if (redoButton) redoButton.disabled = redoStack.length === 0;
}

function pushHistory() {
  const snap = snapshotState();
  const last = undoStack[undoStack.length - 1];
  if (last && statesEqual(last, snap)) return;
  undoStack.push(snap);
  if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
  redoStack.length = 0;
  updateHistoryButtons();
}

function undo() {
  if (isDraggingRoute || isDraggingVertex) return false;
  if (!undoStack.length) {
    updateMessage("没有可撤回的操作");
    return false;
  }
  redoStack.push(snapshotState());
  applySnapshot(undoStack.pop());
  clearPreviewOverlay();
  syncSegmentUi();
  renderRoute();
  updateMessage("已撤回（Ctrl+Y 重做）");
  return true;
}

function redo() {
  if (isDraggingRoute || isDraggingVertex) return false;
  if (!redoStack.length) {
    updateMessage("没有可重做的操作");
    return false;
  }
  undoStack.push(snapshotState());
  if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
  applySnapshot(redoStack.pop());
  clearPreviewOverlay();
  syncSegmentUi();
  renderRoute();
  updateMessage("已重做");
  return true;
}

// ---------- 分段界面 ----------
function syncSegmentUi() {
  const tabs = document.querySelectorAll("[data-segment]");
  Array.prototype.forEach.call(tabs, (button) => {
    const key = button.getAttribute("data-segment");
    if (key === activeSegment) button.classList.add("active");
    else button.classList.remove("active");
  });

  const firstBox = document.getElementById("useFirstLap");
  const lastBox = document.getElementById("useLastLap");
  if (firstBox) firstBox.checked = Boolean(segmentEnabled.first);
  if (lastBox) lastBox.checked = Boolean(segmentEnabled.last);

  const clearButton = document.getElementById("clearRoute");
  if (clearButton) clearButton.textContent = "清除" + SEGMENT_LABELS[activeSegment];

  const hint = document.getElementById("segmentHint");
  if (hint) {
    let text;
    if (activeSegment === "main") {
      text = "中间圈都用主路线；首圈 / 尾圈可单独绘制。";
    } else if (getLapCount() < 2) {
      text = `圈数至少为 2 时，自定义${SEGMENT_LABELS[activeSegment]}才会生效。`;
    } else {
      text = `正在编辑${SEGMENT_LABELS[activeSegment]}，会替换${activeSegment === "first" ? "第一圈" : "最后一圈"}。`;
    }
    hint.textContent = text;
  }
}

function switchSegment(key) {
  if (!SEGMENT_LABELS[key] || key === activeSegment) {
    syncSegmentUi();
    return;
  }
  activeSegment = key;
  if (key !== "main" && !segmentEnabled[key] && segments[key].length > 0) {
    segmentEnabled[key] = true;
  } else if (key !== "main") {
    segmentEnabled[key] = true;
  }
  clearPreviewOverlay();
  renderRoute();
  updateMessage(`正在编辑${SEGMENT_LABELS[key]}（${segments[key].length} 个结点）`);
}

function toggleSegmentEnabled(key, enabled) {
  if (key !== "first" && key !== "last") return;
  if (Boolean(segmentEnabled[key]) === Boolean(enabled)) return;
  pushHistory();
  segmentEnabled[key] = Boolean(enabled);
  clearPreviewOverlay();
  renderRoute();
  updateMessage(
    enabled
      ? `已启用自定义${SEGMENT_LABELS[key]}（${segments[key].length} 个结点）`
      : `已关闭自定义${SEGMENT_LABELS[key]}，该圈改用主路线`
  );
}

// ---------- 绘制 ----------
function polylineOptions(segmentKey) {
  const isActive = segmentKey === activeSegment;
  return {
    color: SEGMENT_COLORS[segmentKey],
    weight: isActive ? 4 : 2.5,
    opacity: isActive ? 0.95 : 0.6,
    dashArray: isActive ? null : "6 6",
    interactive: isActive,
    bubblingMouseEvents: false,
    className: "route-line route-line-" + segmentKey
  };
}

function removePolyline(segmentKey) {
  if (polylines[segmentKey]) {
    map.removeLayer(polylines[segmentKey]);
    polylines[segmentKey] = null;
  }
}

function ensureSegmentPolyline(segmentKey) {
  const points = segments[segmentKey];
  if (points.length < 2) {
    removePolyline(segmentKey);
    return;
  }
  const isActive = segmentKey === activeSegment;
  const existing = polylines[segmentKey];
  if (existing && existing._fitActive === isActive) {
    existing.setLatLngs(segmentDisplayPoints(segmentKey));
    return;
  }
  if (existing) removePolyline(segmentKey);
  const layer = L.polyline(segmentDisplayPoints(segmentKey), polylineOptions(segmentKey)).addTo(map);
  layer._fitActive = isActive;
  if (isActive) layer.on("mousedown", onRouteLineMouseDown);
  polylines[segmentKey] = layer;
}

function vertexIcon() {
  return L.divIcon({
    className: "route-vertex",
    html: "<span></span>",
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
}

function createVertexMarker(index) {
  const points = segments[activeSegment];
  const point = points[index];
  const marker = L.marker([point.lat, point.lng], {
    draggable: true,
    keyboard: false,
    autoPan: true,
    zIndexOffset: 1000,
    icon: vertexIcon(),
    title: `${SEGMENT_LABELS[activeSegment]} 结点 ${index + 1}（拖动可移动）`
  });

  marker.on("dragstart", () => {
    clearPreviewOverlay();
    isDraggingVertex = true;
    dragSnapshot = { index, before: clonePoints(segments[activeSegment]) };
    pushHistory();
  });

  marker.on("drag", (e) => {
    const latlng = e.target.getLatLng();
    const list = segments[activeSegment];
    if (!list[index]) return;
    list[index] = clampPoint({ lat: latlng.lat, lng: latlng.lng });
    const layer = polylines[activeSegment];
    if (layer) layer.setLatLngs(segmentDisplayPoints(activeSegment));
    updateDistanceInfo();
  });

  marker.on("dragend", () => {
    isDraggingVertex = false;
    const snapshot = dragSnapshot;
    dragSnapshot = null;
    if (snapshot && samePoints(snapshot.before, segments[activeSegment])) {
      undoStack.pop();
      updateHistoryButtons();
    } else {
      updateMessage(`已移动${SEGMENT_LABELS[activeSegment]}结点 ${index + 1}（Ctrl+Z 撤回）`);
    }
    const layer = polylines[activeSegment];
    if (layer) layer.setLatLngs(segmentDisplayPoints(activeSegment));
    updateDistanceInfo();
  });

  return marker;
}

function removeAllVertices() {
  for (let i = 0; i < vertexMarkers.length; i++) {
    if (vertexMarkers[i]) map.removeLayer(vertexMarkers[i]);
  }
  vertexMarkers = [];
}

function renderVertices() {
  removeAllVertices();
  const points = segments[activeSegment];
  for (let i = 0; i < points.length; i++) {
    vertexMarkers.push(createVertexMarker(i).addTo(map));
  }
}

function moveVertexMarkers() {
  const points = segments[activeSegment];
  if (vertexMarkers.length !== points.length) {
    renderVertices();
    return;
  }
  for (let i = 0; i < points.length; i++) {
    vertexMarkers[i].setLatLng([points[i].lat, points[i].lng]);
  }
}

function renderRoute() {
  SEGMENT_KEYS.forEach((key) => ensureSegmentPolyline(key));
  renderVertices();
  updateDistanceInfo();
  updateHistoryButtons();
  syncSegmentUi();
}

function refreshActiveSegmentGeometry() {
  const layer = polylines[activeSegment];
  if (layer) layer.setLatLngs(segmentDisplayPoints(activeSegment));
  moveVertexMarkers();
  updateDistanceInfo();
}

// ---------- 整条平移（只平移当前编辑的分段） ----------
function onRouteLineMouseDown(e) {
  if (isDraggingRoute) return;
  const points = segments[activeSegment];
  if (points.length < 2) return;
  if (e.originalEvent && typeof e.originalEvent.button === "number" && e.originalEvent.button !== 0) {
    return;
  }
  const startLatLng = e.latlng;
  if (!startLatLng) return;

  clearPreviewOverlay();
  const origin = clonePoints(points);
  isDraggingRoute = true;
  pushHistory();

  const mapWasDraggable = map.dragging ? map.dragging.enabled() : false;
  if (mapWasDraggable) map.dragging.disable();
  const container = map.getContainer ? map.getContainer() : null;
  if (container) container.style.cursor = "grabbing";

  let moved = false;

  const onDocMove = (ev) => {
    if (!isDraggingRoute) return;
    const latlng = map.mouseEventToLatLng(ev);
    const dLat = latlng.lat - startLatLng.lat;
    const dLng = latlng.lng - startLatLng.lng;
    if (!moved && (Math.abs(dLat) > 0 || Math.abs(dLng) > 0)) moved = true;
    segments[activeSegment] = origin.map((p) => clampPoint({ lat: p.lat + dLat, lng: p.lng + dLng }));
    refreshActiveSegmentGeometry();
  };

  const finish = () => {
    if (!isDraggingRoute) return;
    isDraggingRoute = false;
    document.removeEventListener("mousemove", onDocMove);
    document.removeEventListener("mouseup", finish);
    document.removeEventListener("mouseleave", finish);
    if (typeof window !== "undefined" && window.removeEventListener) {
      window.removeEventListener("blur", finish);
    }
    if (mapWasDraggable) map.dragging.enable();
    if (container) container.style.cursor = "";
    if (!moved) {
      undoStack.pop();
      updateHistoryButtons();
    } else {
      suppressMapClickUntil = Date.now() + 500;
      updateMessage(`已平移${SEGMENT_LABELS[activeSegment]}（Ctrl+Z 撤回）`);
    }
    refreshActiveSegmentGeometry();
  };

  document.addEventListener("mousemove", onDocMove);
  document.addEventListener("mouseup", finish);
  document.addEventListener("mouseleave", finish);
  if (typeof window !== "undefined" && window.addEventListener) {
    window.addEventListener("blur", finish);
  }
  if (e.originalEvent && e.originalEvent.preventDefault) e.originalEvent.preventDefault();
}

// ---------- 导出 / 导入 ----------
function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function round6(value) {
  return Math.round(value * 1e6) / 1e6;
}

function buildRouteExportData() {
  const features = [];
  SEGMENT_KEYS.forEach((key) => {
    const points = segments[key];
    if (points.length < 2) return;
    features.push({
      type: "Feature",
      properties: {
        segment: key,
        label: SEGMENT_LABELS[key],
        enabled: key === "main" ? true : Boolean(segmentEnabled[key])
      },
      geometry: {
        type: "LineString",
        coordinates: points.map((p) => [round6(p.lng), round6(p.lat)])
      }
    });
  });
  return {
    type: "FeatureCollection",
    properties: {
      name: "Fit Tool route",
      tool: "Fit Tool v1.7",
      routeMode,
      lapCount: getLapCount(),
      routeOffset: getRouteOffset(),
      exportedAt: new Date().toISOString()
    },
    features
  };
}

function exportRoute() {
  if (segments.main.length < 2) {
    updateMessage("至少需要两个主路线结点才能导出路线", true);
    return;
  }
  try {
    const blob = new Blob([JSON.stringify(buildRouteExportData(), null, 2)], {
      type: "application/geo+json"
    });
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const stamp =
      now.getFullYear() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      "-" +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());
    downloadBlob(blob, `route-${stamp}.geojson`);
    const parts = SEGMENT_KEYS.filter((key) => segments[key].length >= 2).map(
      (key) => `${SEGMENT_LABELS[key]} ${segments[key].length} 点`
    );
    updateMessage(`已导出路线：${parts.join(" / ")}`);
  } catch (e) {
    updateMessage("导出失败：" + ((e && e.message) || "未知错误"), true);
  }
}

function coordinatesToPoints(coordinates) {
  if (!Array.isArray(coordinates)) return null;
  const points = [];
  for (const item of coordinates) {
    if (!Array.isArray(item) || item.length < 2) return null;
    const lng = Number(item[0]);
    const lat = Number(item[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    points.push({ lat, lng });
  }
  return points;
}

// 兼容 GeoJSON（Feature / FeatureCollection / LineString / MultiLineString / Polygon）与旧版 JSON
function extractRoutePoints(data) {
  if (!data) return null;
  if (Array.isArray(data)) {
    if (!data.length) return null;
    if (typeof data[0] === "object" && data[0] && typeof data[0].lat === "number") {
      return data.map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) }));
    }
    if (Array.isArray(data[0])) return coordinatesToPoints(data);
    return null;
  }
  if (typeof data !== "object") return null;
  if (data.type === "Feature" && data.geometry) return extractRoutePoints(data.geometry);
  if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
    for (const feature of data.features) {
      const points = extractRoutePoints(feature);
      if (points && points.length >= 2) return points;
    }
    return null;
  }
  if (data.type === "LineString") return coordinatesToPoints(data.coordinates);
  if (data.type === "MultiLineString" && Array.isArray(data.coordinates)) {
    const merged = [];
    for (const line of data.coordinates) {
      const points = coordinatesToPoints(line);
      if (points) merged.push(...points);
    }
    return merged.length ? merged : null;
  }
  if (data.type === "Polygon" && Array.isArray(data.coordinates)) {
    return coordinatesToPoints(data.coordinates[0]);
  }
  if (Array.isArray(data.points)) return extractRoutePoints(data.points);
  if (data.geometry) return extractRoutePoints(data.geometry);
  return null;
}

function validateImportedPoints(points) {
  if (!points || points.length < 2) {
    throw new Error("文件里没有足够的轨迹点（至少需要 2 个）");
  }
  if (points.length > 5000) {
    throw new Error("轨迹点太多（超过 5000 个），请精简后再导入");
  }
  const cleaned = [];
  for (const point of points) {
    const lat = Number(point && point.lat);
    const lng = Number(point && point.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error("文件里有无效的坐标");
    }
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw new Error("文件里的坐标超出合法范围");
    }
    cleaned.push({ lat, lng });
  }
  return cleaned;
}

// 解析成 { main, first, last, enabled, props }
function extractRouteSegments(data) {
  const result = {
    main: [],
    first: [],
    last: [],
    enabled: { first: false, last: false },
    props: {}
  };
  if (!data || typeof data !== "object") return result;

  if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
    result.props = data.properties || {};
    for (const feature of data.features) {
      if (!feature || feature.type !== "Feature") continue;
      const points = extractRoutePoints(feature);
      if (!points || points.length < 1) continue;
      const props = feature.properties || {};
      const key = props.segment;
      if (key === "first" || key === "last") {
        result[key] = points;
        result.enabled[key] = props.enabled === undefined ? true : Boolean(props.enabled);
      } else if (key === "main") {
        result.main = points;
      } else if (!result.main.length) {
        result.main = points;
      }
    }
    return result;
  }

  const points = extractRoutePoints(data);
  result.main = points || [];
  result.props = data.properties || {};
  return result;
}

function fitViewToRoute() {
  const all = [];
  SEGMENT_KEYS.forEach((key) => {
    segments[key].forEach((p) => all.push(p));
  });
  if (!all.length) return;
  try {
    if (all.length === 1) {
      map.setView([all[0].lat, all[0].lng], Math.max(map.getZoom(), 15));
      return;
    }
    const bounds = L.latLngBounds(all.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
  } catch (e) {
    // 视图调整失败不影响数据
  }
}

function importRouteFromText(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error("不是有效的 JSON / GeoJSON 文件");
  }

  const parsed = extractRouteSegments(data);
  // 没标分段、只导入了单独一条线时，把它当成主路线
  if (!parsed.main.length && parsed.first.length && !parsed.last.length) {
    parsed.main = parsed.first;
    parsed.first = [];
    parsed.enabled.first = false;
  } else if (!parsed.main.length && parsed.last.length) {
    parsed.main = parsed.last;
    parsed.last = [];
    parsed.enabled.last = false;
  }

  if (parsed.main.length < 2) {
    throw new Error("文件里没有主路线（至少需要 2 个点）");
  }

  const cleanMain = validateImportedPoints(parsed.main);
  const cleanFirst = parsed.first.length ? validateImportedPoints(parsed.first) : [];
  const cleanLast = parsed.last.length ? validateImportedPoints(parsed.last) : [];

  pushHistory();
  clearPreviewOverlay();
  segments.main = cleanMain.map(clampPoint);
  segments.first = cleanFirst.map(clampPoint);
  segments.last = cleanLast.map(clampPoint);
  segmentEnabled.first = segments.first.length >= 2 && parsed.enabled.first;
  segmentEnabled.last = segments.last.length >= 2 && parsed.enabled.last;
  activeSegment = "main";

  const props = parsed.props || {};
  if (props.routeMode === "loop" || props.routeMode === "linear") {
    const modeSelect = document.getElementById("routeMode");
    if (modeSelect) {
      modeSelect.value = props.routeMode;
      applyRouteMode();
    }
  }
  if (Number.isFinite(Number(props.lapCount)) && Number(props.lapCount) > 0) {
    const lapInput = document.getElementById("lapCount");
    if (lapInput) lapInput.value = String(Math.max(1, Math.floor(Number(props.lapCount))));
  }
  if (Number.isFinite(Number(props.routeOffset))) {
    const offsetInput = document.getElementById("routeOffset");
    if (offsetInput) {
      offsetInput.value = String(clampRouteOffset(props.routeOffset));
      syncRouteOffsetLabel();
    }
  }

  renderRoute();
  fitViewToRoute();
  const parts = [`主路线 ${segments.main.length} 点`];
  if (segments.first.length >= 2) parts.push(`首圈 ${segments.first.length} 点`);
  if (segments.last.length >= 2) parts.push(`尾圈 ${segments.last.length} 点`);
  updateMessage(`已导入路线：${parts.join(" / ")}`);
}

function readFileAsText(file) {
  if (file && typeof file.text === "function") {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      reject(new Error("当前浏览器不支持读取文件"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsText(file);
  });
}

function clearActiveSegment() {
  const key = activeSegment;
  if (!segments[key].length) {
    updateMessage(`${SEGMENT_LABELS[key]}已经是空的`);
    return;
  }
  pushHistory();
  segments[key] = [];
  if (key !== "main") segmentEnabled[key] = false;
  clearPreviewOverlay();
  renderRoute();
  updateMessage(`已清除${SEGMENT_LABELS[key]}（Ctrl+Z 可恢复）`);
}

map.on("click", (e) => {
  if (Date.now() < suppressMapClickUntil) {
    suppressMapClickUntil = 0;
    return;
  }
  pushHistory();
  clearPreviewOverlay();
  segments[activeSegment].push(clampPoint({ lat: e.latlng.lat, lng: e.latlng.lng }));
  if (activeSegment !== "main") segmentEnabled[activeSegment] = true;
  renderRoute();
  updateMessage(
    `已添加${SEGMENT_LABELS[activeSegment]}结点：${segments[activeSegment].length}（Ctrl+Z 撤回）`
  );
});

const clearBtn = document.getElementById("clearRoute");
if (clearBtn) {
  clearBtn.addEventListener("click", () => clearActiveSegment());
}

const undoBtn = document.getElementById("undoBtn");
if (undoBtn) undoBtn.addEventListener("click", () => undo());
const redoBtn = document.getElementById("redoBtn");
if (redoBtn) redoBtn.addEventListener("click", () => redo());
const exportRouteBtn = document.getElementById("exportRouteBtn");
if (exportRouteBtn) exportRouteBtn.addEventListener("click", () => exportRoute());

const importFileInput = document.getElementById("importFile");
const importRouteBtn = document.getElementById("importRouteBtn");
if (importRouteBtn && importFileInput) {
  importRouteBtn.addEventListener("click", () => importFileInput.click());
  importFileInput.addEventListener("change", async () => {
    const file = importFileInput.files && importFileInput.files[0];
    importFileInput.value = "";
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      importRouteFromText(text);
    } catch (e) {
      updateMessage((e && e.message) || "导入失败", true);
    }
  });
}

const segmentTabs = document.querySelectorAll("[data-segment]");
Array.prototype.forEach.call(segmentTabs, (button) => {
  button.addEventListener("click", () => switchSegment(button.getAttribute("data-segment")));
});

const useFirstCheckbox = document.getElementById("useFirstLap");
if (useFirstCheckbox) {
  useFirstCheckbox.addEventListener("change", () => toggleSegmentEnabled("first", useFirstCheckbox.checked));
}
const useLastCheckbox = document.getElementById("useLastLap");
if (useLastCheckbox) {
  useLastCheckbox.addEventListener("change", () => toggleSegmentEnabled("last", useLastCheckbox.checked));
}

// 快捷键：Ctrl/Cmd+Z 撤回，Ctrl/Cmd+Y 或 Ctrl/Cmd+Shift+Z 重做
document.addEventListener("keydown", (e) => {
  const target = e.target;
  const tag = target && target.tagName ? String(target.tagName).toLowerCase() : "";
  const isEditable =
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    (target && target.isContentEditable);
  if (isEditable) return;
  if (!(e.ctrlKey || e.metaKey)) return;
  const key = String(e.key || "").toLowerCase();
  if (key === "z" && !e.shiftKey) {
    e.preventDefault();
    undo();
  } else if (key === "y" || (key === "z" && e.shiftKey)) {
    e.preventDefault();
    redo();
  }
});


// ==================== 导出时间列表 ====================
function dateToLocalInputValue(d) {
  const tzOffset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tzOffset * 60000);
  return local.toISOString().slice(0, 16);
}

function rebuildExportTimes() {
  const container = document.getElementById("exportTimes");
  const exportInput = document.getElementById("exportCount");
  if (!container || !exportInput) return;

  const count = Math.max(1, Math.min(10, parseInt(exportInput.value, 10) || 1));
  const now = new Date();

  container.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const row = document.createElement("div");
    row.className = "export-time-row";

    const label = document.createElement("span");
    label.textContent = `第 ${i + 1} 份`;

    const timeInput = document.createElement("input");
    timeInput.type = "datetime-local";
    timeInput.className = "export-time-input";
    timeInput.dataset.index = String(i);
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    timeInput.value = dateToLocalInputValue(d);

    const paceMinInput = document.createElement("input");
    paceMinInput.type = "number";
    paceMinInput.className = "export-pace-min";
    paceMinInput.min = "0";
    paceMinInput.step = "0.1";
    paceMinInput.value = "6";

    const paceSecInput = document.createElement("input");
    paceSecInput.type = "number";
    paceSecInput.className = "export-pace-sec";
    paceSecInput.min = "0";
    paceSecInput.max = "59.9";
    paceSecInput.step = "0.1";
    paceSecInput.value = "0";

    row.appendChild(label);
    row.appendChild(timeInput);
    row.appendChild(paceMinInput);
    row.appendChild(paceSecInput);
    container.appendChild(row);
  }
}

// ==================== 生成后端：桌面版走本地服务，网页版走浏览器内核 ====================
function normalizeGenerationError(e) {
  if (e instanceof Error) return e;
  const message = (e && (e.message || e.error)) || "操作失败";
  return new Error(message);
}

const Backend = (function () {
  const core =
    typeof window !== "undefined" &&
    window.FitCore &&
    typeof window.FitCore.generateFitFile === "function"
      ? window.FitCore
      : null;

  if (core) {
    return {
      mode: "local",
      async preview(body) {
        try {
          return core.previewActivity(body);
        } catch (e) {
          throw normalizeGenerationError(e);
        }
      },
      async generate(body) {
        try {
          const result = core.generateFitFile(body);
          return { bytes: result.bytes, filename: result.filename };
        } catch (e) {
          throw normalizeGenerationError(e);
        }
      }
    };
  }

  return {
    mode: "server",
    async preview(body) {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "预览失败");
      }
      return res.json();
    },
    async generate(body) {
      const res = await fetch("/api/generate-fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "生成失败");
      }
      return { bytes: new Uint8Array(await res.arrayBuffer()) };
    }
  };
})();

// ==================== 生成 FIT ====================
async function generateFit() {
  if (segments.main.length < 2) {
    updateMessage("请至少在地图上选择两个点形成主路线", true);
    return;
  }

  const hrRest = parseInt(document.getElementById("hrRest").value, 10) || 60;
  const hrMax = parseInt(document.getElementById("hrMax").value, 10) || 180;

  const exportInput = document.getElementById("exportCount");
  const lapCount = getLapCount();
  const exportCount = Math.max(
    1,
    Math.min(10, parseInt(exportInput && exportInput.value, 10) || 1)
  );

  const exportTimesContainer = document.getElementById("exportTimes");
  const timeInputs = exportTimesContainer
    ? Array.from(exportTimesContainer.querySelectorAll(".export-time-input"))
    : [];
  const paceMinInputs = exportTimesContainer
    ? Array.from(exportTimesContainer.querySelectorAll(".export-pace-min"))
    : [];
  const paceSecInputs = exportTimesContainer
    ? Array.from(exportTimesContainer.querySelectorAll(".export-pace-sec"))
    : [];

  if (
    timeInputs.length < exportCount ||
    paceMinInputs.length < exportCount ||
    paceSecInputs.length < exportCount
  ) {
    updateMessage("导出份数与时间/配速行数不一致", true);
    return;
  }

  const wgsPoints = convertPointsToWgs84(segments.main);
  const wgsFirstLap = segmentUsable("first") ? convertPointsToWgs84(segments.first) : null;
  const wgsLastLap = segmentUsable("last") ? convertPointsToWgs84(segments.last) : null;

  try {
    for (let i = 0; i < exportCount; i++) {
      updateMessage(`正在生成第 ${i + 1}/${exportCount} 个 FIT 文件，请稍候...`);

      const input = timeInputs[i];
      if (!input || !input.value) {
        updateMessage(`请为第 ${i + 1} 份设置开始日期时间`, true);
        return;
      }
      const fileStart = new Date(input.value);
      if (Number.isNaN(fileStart.getTime())) {
        updateMessage(`第 ${i + 1} 份的开始时间无效`, true);
        return;
      }

      const pm = parseFloat(paceMinInputs[i] && paceMinInputs[i].value);
      const ps = parseFloat(paceSecInputs[i] && paceSecInputs[i].value);
      const paceSecondsPerKm =
        (Number.isFinite(pm) ? pm : 0) * 60 + (Number.isFinite(ps) ? ps : 0);
      if (!paceSecondsPerKm || paceSecondsPerKm <= 0) {
        updateMessage(`第 ${i + 1} 份的配速无效`, true);
        return;
      }

      // 先让"正在生成"的提示刷新出来，再做计算
      await new Promise((resolve) => setTimeout(resolve, 30));

      let result;
      try {
        result = await Backend.generate({
          startTime: fileStart.toISOString(),
          points: wgsPoints,
          firstLapPoints: wgsFirstLap,
          lastLapPoints: wgsLastLap,
          paceSecondsPerKm,
          hrRest,
          hrMax,
          lapCount,
          routeMode,
          routeOffset: getRouteOffset(),
          variantIndex: i + 1,
          weightKg: getWeightKg()
        });
      } catch (e) {
        updateMessage((e && e.message) || "生成失败", true);
        return;
      }

      const blob = new Blob([result.bytes], { type: "application/vnd.ant.fit" });
      downloadBlob(blob, exportCount > 1 ? `run_${i + 1}.fit` : "run.fit");
    }
    updateMessage(`已生成 ${exportCount} 个 FIT 文件并开始下载`);
  } catch (e) {
    console.error(e);
    updateMessage((e && (e.message || e.error)) || "\u751F\u6210\u5931\u8D25", true);
  }
}

const genBtn = document.getElementById("generateFit");
genBtn.addEventListener("click", generateFit);

const lapInputInit = document.getElementById("lapCount");
if (lapInputInit) {
  lapInputInit.addEventListener("input", updateDistanceInfo);
}
const exportInputInit = document.getElementById("exportCount");
if (exportInputInit) {
  exportInputInit.addEventListener("input", rebuildExportTimes);
}

const routeModeSelect = document.getElementById("routeMode");
const lapCountGroup = document.getElementById("lapCountGroup");

function applyRouteMode() {
  routeMode = routeModeSelect && routeModeSelect.value === "linear" ? "linear" : "loop";
  if (lapCountGroup) {
    lapCountGroup.style.display = routeMode === "loop" ? "" : "none";
  }
  renderRoute();
  updateDistanceInfo();
}

if (routeModeSelect) {
  routeModeSelect.addEventListener("change", applyRouteMode);
}
applyRouteMode();
updateDistanceInfo();
rebuildExportTimes();

async function previewActivity() {
  if (segments.main.length < 2) {
    updateMessage("请至少在地图上选择两个点形成主路线", true);
    return;
  }

  const exportTimesContainer = document.getElementById("exportTimes");
  const timeInputs = exportTimesContainer
    ? Array.from(exportTimesContainer.querySelectorAll(".export-time-input"))
    : [];
  const paceMinInputs = exportTimesContainer
    ? Array.from(exportTimesContainer.querySelectorAll(".export-pace-min"))
    : [];
  const paceSecInputs = exportTimesContainer
    ? Array.from(exportTimesContainer.querySelectorAll(".export-pace-sec"))
    : [];

  if (!timeInputs.length || !paceMinInputs.length || !paceSecInputs.length) {
    updateMessage("请先在导出列表中设置至少一份的时间和配速", true);
    return;
  }

  const firstTimeInput = timeInputs[0];
  if (!firstTimeInput.value) {
    const now = new Date();
    firstTimeInput.value = dateToLocalInputValue(now);
  }
  const start = new Date(firstTimeInput.value);
  if (Number.isNaN(start.getTime())) {
    updateMessage("预览使用的开始时间无效", true);
    return;
  }

  const pm = parseFloat(paceMinInputs[0] && paceMinInputs[0].value);
  const ps = parseFloat(paceSecInputs[0] && paceSecInputs[0].value);
  const paceSecondsPerKm =
    (Number.isFinite(pm) ? pm : 0) * 60 + (Number.isFinite(ps) ? ps : 0);
  if (!paceSecondsPerKm || paceSecondsPerKm <= 0) {
    updateMessage("预览使用的配速无效", true);
    return;
  }

  const hrRest = parseInt(document.getElementById("hrRest").value, 10) || 60;
  const hrMax = parseInt(document.getElementById("hrMax").value, 10) || 180;

  const lapCount = getLapCount();

  updateMessage("正在生成预览，请稍候...");

  try {
    await new Promise((resolve) => setTimeout(resolve, 20));
    let data;
    try {
      data = await Backend.preview({
        startTime: start.toISOString(),
        points: convertPointsToWgs84(segments.main),
        firstLapPoints: segmentUsable("first") ? convertPointsToWgs84(segments.first) : null,
        lastLapPoints: segmentUsable("last") ? convertPointsToWgs84(segments.last) : null,
        paceSecondsPerKm,
        hrRest,
        hrMax,
        lapCount,
        routeMode,
        routeOffset: getRouteOffset(),
        weightKg: getWeightKg()
      });
    } catch (e) {
      updateMessage((e && e.message) || "预览失败", true);
      return;
    }

    const km = (data.totalDistanceMeters / 1000).toFixed(2);
    const min = (data.totalDurationSec / 60).toFixed(1);
    const offsetUsed = getRouteOffset();
    updateMessage(
      `预览已生成，总距离约 ${km} 公里，总时间约 ${min} 分钟（路线偏移 ${offsetUsed.toFixed(1)} 米）`
    );
    previewData = data;
    previewIndex = 0;
    if (previewTimer) {
      clearInterval(previewTimer);
      previewTimer = null;
    }
    if (previewMarker) {
      map.removeLayer(previewMarker);
      previewMarker = null;
    }
    if (previewTrace) {
      map.removeLayer(previewTrace);
      previewTrace = null;
    }
    const samples = previewData.samples || [];
    if (samples.length > 0) {
      // 先把整条生成轨迹画出来，能直接看出路线偏移效果，再决定导出
      previewTrace = L.polyline(
        samples.map((s) => toMapCoords(s.lat, s.lng)),
        { color: "#1976d2", weight: 2, opacity: 0.5, dashArray: "6 4" }
      ).addTo(map);
      const first = samples[0];
      const pos = toMapCoords(first.lat, first.lng);
      previewMarker = L.circleMarker([pos.lat, pos.lng], {
        radius: 6,
        color: "#1976d2"
      }).addTo(map);
      startPreviewPlayback();
    }
  } catch (e) {
    console.error(e);
    updateMessage((e && (e.message || e.error)) || "预览失败", true);
  }
}

const previewBtn = document.getElementById("previewBtn");
if (previewBtn) {
  previewBtn.addEventListener("click", previewActivity);
}

function updateLiveInfo(sample) {
  const el = document.getElementById("liveInfo");
  if (!el || !sample) return;
  const t = Math.max(0, sample.timeSec || 0);
  const min = Math.floor(t / 60);
  const sec = Math.floor(t % 60);
  const speed = sample.speed > 0 ? sample.speed : 0.01;
  const secPerKm = 1000 / speed;
  const paceMin = Math.floor(secPerKm / 60);
  const paceSec = Math.round(secPerKm % 60);
  const paceStr = `${paceMin}'${paceSec.toString().padStart(2, "0")}"/km`;
  const hr = sample.heartRate || 0;
  el.textContent = `时间 ${min}:${sec.toString().padStart(2, "0")}  配速 ${paceStr}  心率 ${hr} bpm`;
}

function startPreviewPlayback() {
  const samples = previewData && previewData.samples;
  if (!samples || !samples.length) return;

  const totalSamples = samples.length;
  const stepMs = 100;
  previewIndex = 0;

  if (previewTimer) {
    clearInterval(previewTimer);
  }

  previewTimer = setInterval(() => {
    if (previewIndex >= totalSamples) {
      clearInterval(previewTimer);
      previewTimer = null;
      return;
    }
    const s = samples[previewIndex];
    if (previewMarker && s.lat != null && s.lng != null) {
      const pos = toMapCoords(s.lat, s.lng);
      previewMarker.setLatLng([pos.lat, pos.lng]);
    }
    updateLiveInfo(s);
    previewIndex += 1;
  }, stepMs);
}
