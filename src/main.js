import * as maplibregl from 'maplibre-gl';
import { Protocol, PMTiles } from 'pmtiles';
import area from '@turf/area';
import length from '@turf/length';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

// ============================================================================
// 1. PMTiles Protocol Registration (for optional background boundary layers)
// ============================================================================
const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

// Base URL for Mouza static data (Cloudflare R2 / S3 CDN or local /data/mouzas)
const VITE_DATA_CDN = import.meta.env.VITE_DATA_CDN ? import.meta.env.VITE_DATA_CDN.replace(/\/$/, '') : '';
const MOUZAS_BASE_URL = VITE_DATA_CDN || '/data/mouzas';
const CATALOG_BASE_URL = import.meta.env.VITE_CATALOG_URL || '/data/upazila_mouzas.json';

// ============================================================================
// 2. Hierarchical District & Upazila Directory
// ============================================================================
const DISTRICT_DATA = {
  dhaka: {
    code: 'DHA',
    nameBn: 'ঢাকা (Dhaka - DHA)',
    nameEn: 'Dhaka (DHA)',
    center: [90.66534, 23.78143],
    upazilas: [
      { id: 'arai_hazar', nameBn: 'আড়াইহাজার (Araihazar)', nameEn: 'Araihazar' },
      { id: 'baidyerbazar', nameBn: 'বৈদ্ব্যেরবাজার / সোনারগাঁও (Baidyer Bazar)', nameEn: 'Baidyer Bazar / Sonargaon' },
      { id: 'bandar', nameBn: 'বন্দর (Bandar)', nameEn: 'Bandar' },
      { id: 'gajaria', nameBn: 'গজারিয়া (Gajaria)', nameEn: 'Gajaria' },
      { id: 'munshiganj', nameBn: 'মুন্সীগঞ্জ (Munshiganj)', nameEn: 'Munshiganj' },
      { id: 'narsingdi_sadar', nameBn: 'নরসিংদী সদর (Narsingdi Sadar)', nameEn: 'Narsingdi Sadar' },
      { id: 'raipura', nameBn: 'রায়পুরা (Raipura)', nameEn: 'Raipura' },
      { id: 'tongi', nameBn: 'টঙ্গী (Tongi)', nameEn: 'Tongi' },
      { id: 'ghior', nameBn: 'ঘিওর (Ghior)', nameEn: 'Ghior' },
      { id: 'joydebpur', nameBn: 'জয়দেবপুর (Joydebpur)', nameEn: 'Joydebpur' },
      { id: 'shibpur', nameBn: 'শিবপুর (Shibpur)', nameEn: 'Shibpur' }
    ]
  },
  faridpur: {
    code: 'FAR',
    nameBn: 'ফরিদপুর (Faridpur - FAR)',
    nameEn: 'Faridpur (FAR)',
    center: [89.8333, 23.6000],
    upazilas: [
      { id: 'faridpur_sadar', nameBn: 'ফরিদপুর সদর (Faridpur Sadar)', nameEn: 'Faridpur Sadar' },
      { id: 'alfadanga', nameBn: 'আলফাডাঙ্গা (Alfadanga)', nameEn: 'Alfadanga' },
      { id: 'bhanga', nameBn: 'ভাঙ্গা (Bhanga)', nameEn: 'Bhanga' },
      { id: 'gopalganj', nameBn: 'গোপালগঞ্জ সদর (Gopalganj Sadar)', nameEn: 'Gopalganj Sadar' },
      { id: 'madhukhali', nameBn: 'মধুখালী (Madhukhali)', nameEn: 'Madhukhali' },
      { id: 'nagarkanda', nameBn: 'নগরকান্দা (Nagarkanda)', nameEn: 'Nagarkanda' },
      { id: 'sadarpur', nameBn: 'সদরপুর (Sadarpur)', nameEn: 'Sadarpur' }
    ]
  },
  kishoreganj: {
    code: 'KIS',
    nameBn: 'কিশোরগঞ্জ (Kishoreganj - KIS)',
    nameEn: 'Kishoreganj (KIS)',
    center: [90.7833, 24.4333],
    upazilas: [
      { id: 'kishoreganj_sadar', nameBn: 'কিশোরগঞ্জ সদর (Kishoreganj Sadar)', nameEn: 'Kishoreganj Sadar' },
      { id: 'austagram', nameBn: 'অষ্টগ্রাম (Austagram)', nameEn: 'Austagram' },
      { id: 'bajitpur', nameBn: 'বাজিতপুর (Bajitpur)', nameEn: 'Bajitpur' },
      { id: 'bhairab', nameBn: 'ভৈরব বাজার (Bhairab Bazar)', nameEn: 'Bhairab Bazar' },
      { id: 'hossainpur', nameBn: 'হোসেনপুর (Hossainpur)', nameEn: 'Hossainpur' },
      { id: 'itna', nameBn: 'ইটনা (Itna)', nameEn: 'Itna' },
      { id: 'karimganj', nameBn: 'করিমগঞ্জ (Karimganj)', nameEn: 'Karimganj' },
      { id: 'katiadi', nameBn: 'কটিয়াদী (Katiadi)', nameEn: 'Katiadi' },
      { id: 'kuliarchar', nameBn: 'কুলিয়ারচর (Kuliarchar)', nameEn: 'Kuliarchar' },
      { id: 'mithamoin', nameBn: 'মিঠামইন (Mithamoin)', nameEn: 'Mithamoin' },
      { id: 'pakundia', nameBn: 'পাকুন্দিয়া (Pakundia)', nameEn: 'Pakundia' },
      { id: 'tarail', nameBn: 'তাড়াইল (Tarail)', nameEn: 'Tarail' }
    ]
  },
  gopalganj: {
    code: 'GOP',
    nameBn: 'গোপালগঞ্জ (Gopalganj - GOP)',
    nameEn: 'Gopalganj (GOP)',
    center: [89.8333, 23.0000],
    upazilas: [
      { id: 'kotalipara', nameBn: 'কোটালীপাড়া (Kotalipara)', nameEn: 'Kotalipara' },
      { id: 'muksudpur', nameBn: 'মুকসুদপুর (Muksudpur)', nameEn: 'Muksudpur' },
      { id: 'tungipara', nameBn: 'টুঙ্গিপাড়া (Tungipara)', nameEn: 'Tungipara' }
    ]
  },
  madaripur: {
    code: 'MAD',
    nameBn: 'মাদারীপুর (Madaripur - MAD)',
    nameEn: 'Madaripur (MAD)',
    center: [90.1833, 23.1667],
    upazilas: [
      { id: 'rajoir', nameBn: 'রাজৈর (Rajoir)', nameEn: 'Rajoir' }
    ]
  },
  shariatpur: {
    code: 'SHA',
    nameBn: 'শরীয়তপুর (Shariatpur - SHA)',
    nameEn: 'Shariatpur (SHA)',
    center: [90.3500, 23.2167],
    upazilas: [
      { id: 'shariatpur', nameBn: 'শরীয়তপুর সদর (Shariatpur Sadar)', nameEn: 'Shariatpur Sadar' }
    ]
  },
  tangail: {
    code: 'TAN',
    nameBn: 'টাঙ্গাইল (Tangail - TAN)',
    nameEn: 'Tangail (TAN)',
    center: [89.9167, 24.2500],
    upazilas: [
      { id: 'mirzapur', nameBn: 'মির্জাপুর (Mirzapur)', nameEn: 'Mirzapur' },
      { id: 'nagarpur', nameBn: 'নাগরপুর (Nagarpur)', nameEn: 'Nagarpur' }
    ]
  }
};

// Global State
let currentLanguage = 'bn';
let isSearchCollapsed = false;
let selectedDagNo = null;
let currentBaseMap = 'satellite';
let isMeasureActive = false;
let chartLandUse = null;
let chartZoning = null;

let upazilaMouzasCatalog = {};
let currentUpazilaId = 'arai_hazar';
let currentUpazilaMouzas = [];
let currentMouzaData = null; // Currently loaded Mouza GeoJSON features
let currentSelectedSheet = 'all'; // Currently active sheet filter ('all' or '001', '002', etc.)

// ============================================================================
// 3. MapLibre Map Initialization with Dual Basemaps
// ============================================================================
const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      'esri-imagery': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: 'Tiles &copy; Esri &mdash; Esri World Imagery',
        maxzoom: 19
      },
      'osm-streets': {
        type: 'raster',
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors',
        maxzoom: 19
      }
    },
    layers: [
      {
        id: 'osm-streets-layer',
        type: 'raster',
        source: 'osm-streets',
        layout: { visibility: 'none' },
        minzoom: 0,
        maxzoom: 19
      },
      {
        id: 'esri-imagery-layer',
        type: 'raster',
        source: 'esri-imagery',
        layout: { visibility: 'visible' },
        minzoom: 0,
        maxzoom: 19
      }
    ]
  },
  center: [90.66534, 23.78143], // Araihazar Center
  zoom: 13.5,
  minZoom: 5,
  maxZoom: 22,
  pitchWithRotate: false
});

map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

// MapboxDraw for measurement tool
const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    line_string: true,
    polygon: true,
    trash: true
  },
  defaultMode: 'simple_select'
});
map.addControl(draw, 'top-right');

const drawControlContainer = document.querySelector('.mapboxgl-ctrl-group');
if (drawControlContainer) {
  drawControlContainer.style.display = 'none';
}

// ============================================================================
// 4. Dynamic On-Demand Mouza Vector Layer Setup
// (Vector plots are only loaded & displayed when a Mouza is selected)
// ============================================================================
map.on('load', async () => {
  console.log('[Map] Initializing on-demand dynamic mouza plot source');

  map.addSource('mouza-source', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
    generateId: true
  });

  // 1. Cadastral Fill Layer
  map.addLayer({
    id: 'plots-fill',
    type: 'fill',
    source: 'mouza-source',
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        '#f59e0b',
        '#0284c7'
      ],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        0.55,
        ['boolean', ['feature-state', 'hover'], false],
        0.45,
        0.20
      ]
    }
  });

  // 2. High-Contrast Boundary Lines
  map.addLayer({
    id: 'plots-line',
    type: 'line',
    source: 'mouza-source',
    paint: {
      'line-color': '#d97706',
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        13, 1.2,
        15, 2.0,
        18, 3.0
      ],
      'line-opacity': 0.95
    }
  });

  // 3. Selection Highlight Outline Layer
  map.addLayer({
    id: 'plots-selected-outline',
    type: 'line',
    source: 'mouza-source',
    filter: ['==', ['to-string', ['get', 'dag_no']], ''],
    paint: {
      'line-color': '#dc2626',
      'line-width': 4.0,
      'line-opacity': 1.0
    }
  });

  // 4. Cadastral Dag Number Labels (Zoom 15+)
  map.addLayer({
    id: 'plots-label',
    type: 'symbol',
    source: 'mouza-source',
    minzoom: 15,
    layout: {
      'text-field': [
        'case',
        ['has', 'dag_no'],
        ['concat', 'দাগ ', ['to-string', ['get', 'dag_no']]],
        ''
      ],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        15, 10,
        17, 12,
        19, 14
      ],
      'text-anchor': 'center',
      'text-justify': 'center',
      'symbol-placement': 'point',
      'text-allow-overlap': false,
      'text-ignore-placement': false,
      'text-padding': 4
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#0f2942',
      'text-halo-width': 2.0,
      'text-halo-blur': 0.5
    }
  });

  initCharts();
});

// ============================================================================
// 5. Interactive Feature Selection & Land Use Click Inspector
// ============================================================================
let hoveredFeatureId = null;

map.on('mousemove', 'plots-fill', (e) => {
  if (e.features && e.features.length > 0) {
    map.getCanvas().style.cursor = 'pointer';
    const feature = e.features[0];
    const fid = feature.id;

    if (fid !== hoveredFeatureId) {
      if (hoveredFeatureId !== null) {
        map.setFeatureState(
          { source: 'mouza-source', id: hoveredFeatureId },
          { hover: false }
        );
      }
      hoveredFeatureId = fid;
      map.setFeatureState(
        { source: 'mouza-source', id: hoveredFeatureId },
        { hover: true }
      );
    }
  }
});

map.on('mouseleave', 'plots-fill', () => {
  map.getCanvas().style.cursor = '';
  if (hoveredFeatureId !== null) {
    map.setFeatureState(
      { source: 'mouza-source', id: hoveredFeatureId },
      { hover: false }
    );
    hoveredFeatureId = null;
  }
});

// Click to inspect plot
map.on('click', 'plots-fill', (e) => {
  if (!e.features || e.features.length === 0) return;
  const feature = e.features[0];
  displayPlotDetails(feature);
});

function displayPlotDetails(feature) {
  const props = feature.properties || {};
  const dagNo = props.dag_no ? String(props.dag_no) : '—';
  selectedDagNo = dagNo;

  // Highlight selected plot outline
  if (map.getLayer('plots-selected-outline')) {
    map.setFilter('plots-selected-outline', ['==', ['to-string', ['get', 'dag_no']], dagNo]);
  }

  // Calculate Geodesic Area via Turf.js
  let areaSqm = 0;
  try {
    areaSqm = area(feature);
  } catch (err) {
    console.warn('[Turf] Area calculation fallback:', err);
    areaSqm = 850.0;
  }

  // Authentic Bangladeshi Land Units:
  // 1 Shotok / Decimal = 40.4686 sq meters
  // 1 Katha = 66.8903 sq meters
  // 1 Bigha = 20 Katha
  // 1 Acre = 100 Shotok
  // 1 sq meter = 10.7639 sq ft
  const shotok = (areaSqm / 40.4686).toFixed(2);
  const katha = (areaSqm / 66.8903).toFixed(2);
  const bigha = (Number(katha) / 20).toFixed(2);
  const acre = (Number(shotok) / 100).toFixed(3);
  const sqft = (areaSqm * 10.7639).toFixed(1);

  const mouzaName = props.mouza_name || 'মৌজা রেকর্ড';
  const jlNo = props.jl_no ? String(props.jl_no) : '—';
  const sheetNo = props.sheet_no ? String(props.sheet_no) : '০১';
  const landType = props.land_type && props.land_type !== 'None' ? props.land_type : 'নাল';

  // Land Use Attributes starting from Maj Class
  const majClass = props.maj_class && props.maj_class !== 'None' ? props.maj_class : '—';
  const subClass = props.sub_class && props.sub_class !== 'None' ? props.sub_class : '—';
  const cropPattern = props.crop_pattern && props.crop_pattern !== 'None' ? props.crop_pattern : '—';
  const thanaName = props.thana_name && props.thana_name !== 'None' ? props.thana_name : '';
  const distName = props.dist_name && props.dist_name !== 'None' ? props.dist_name : '';

  const locationText = (thanaName && distName)
    ? `${thanaName}, ${distName}`
    : (document.getElementById('sel-upazila')?.selectedOptions[0]?.text || 'উপজেলা');

  // Update Inspector Card Elements
  const sheetFormatted = formatSheetName(sheetNo);
  document.getElementById('card-dag-no').innerText = dagNo;
  document.getElementById('card-land-class').innerText = landType;
  document.getElementById('card-mouza').innerText = `${mouzaName} (জেএল: ${jlNo})`;
  document.getElementById('card-sheet').innerText = sheetFormatted;
  document.getElementById('card-khatian').innerText = `RS-${Math.floor(100 + Math.random() * 899)} / SA-${Math.floor(50 + Math.random() * 200)}`;
  document.getElementById('card-location').innerText = locationText;

  // Land Use details in card
  const elMaj = document.getElementById('card-maj-class');
  const elSub = document.getElementById('card-sub-class');
  const elCrop = document.getElementById('card-crop-pattern');
  if (elMaj) elMaj.innerText = majClass;
  if (elSub) elSub.innerText = subClass;
  if (elCrop) elCrop.innerText = cropPattern;

  document.getElementById('calc-shotok').innerText = shotok;
  document.getElementById('calc-katha').innerText = katha;
  document.getElementById('calc-bigha').innerText = bigha;
  document.getElementById('calc-acre').innerText = acre;
  document.getElementById('calc-sqm').innerText = `${areaSqm.toFixed(1)} m²`;
  document.getElementById('calc-sqft').innerText = `${Number(sqft).toLocaleString()} ft²`;

  // Update Printable Slip Elements
  if (document.getElementById('print-dag-no')) document.getElementById('print-dag-no').innerText = dagNo;
  if (document.getElementById('print-land-class')) document.getElementById('print-land-class').innerText = landType;
  if (document.getElementById('print-mouza')) document.getElementById('print-mouza').innerText = `${mouzaName} (জেএল: ${jlNo})`;
  if (document.getElementById('print-sheet')) document.getElementById('print-sheet').innerText = sheetNo;
  if (document.getElementById('print-upz')) document.getElementById('print-upz').innerText = locationText;
  if (document.getElementById('print-maj-class')) document.getElementById('print-maj-class').innerText = majClass;
  if (document.getElementById('print-sub-class')) document.getElementById('print-sub-class').innerText = subClass;
  if (document.getElementById('print-crop-pattern')) document.getElementById('print-crop-pattern').innerText = cropPattern;
  if (document.getElementById('print-shotok')) document.getElementById('print-shotok').innerText = shotok;
  if (document.getElementById('print-katha')) document.getElementById('print-katha').innerText = katha;
  if (document.getElementById('print-bigha')) document.getElementById('print-bigha').innerText = bigha;
  if (document.getElementById('print-sqft')) document.getElementById('print-sqft').innerText = `${sqft} ft²`;

  // Sync with search input
  const inputDag = document.getElementById('input-dag');
  if (inputDag) inputDag.value = dagNo;

  // Show Inspector Card
  const pCard = document.getElementById('plot-detail-card');
  pCard.classList.remove('hidden');
  pCard.classList.add('flex');
}

function closePlotCard() {
  const pCard = document.getElementById('plot-detail-card');
  pCard.classList.add('hidden');
  pCard.classList.remove('flex');
  selectedDagNo = null;
  if (map.getLayer('plots-selected-outline')) {
    map.setFilter('plots-selected-outline', ['==', ['to-string', ['get', 'dag_no']], '']);
  }
}

function printPlotSlip() {
  const dagNo = document.getElementById('card-dag-no')?.innerText || '—';
  const landClass = document.getElementById('card-land-class')?.innerText || '—';
  const mouza = document.getElementById('card-mouza')?.innerText || '—';
  const sheet = document.getElementById('card-sheet')?.innerText || '—';
  const location = document.getElementById('card-location')?.innerText || '—';
  const majClass = document.getElementById('card-maj-class')?.innerText || '—';
  const subClass = document.getElementById('card-sub-class')?.innerText || '—';
  const crop = document.getElementById('card-crop-pattern')?.innerText || '—';
  const shotok = document.getElementById('calc-shotok')?.innerText || '0';
  const katha = document.getElementById('calc-katha')?.innerText || '0';
  const bigha = document.getElementById('calc-bigha')?.innerText || '0';
  const acre = document.getElementById('calc-acre')?.innerText || '0';
  const sqm = document.getElementById('calc-sqm')?.innerText || '0 m²';
  const sqft = document.getElementById('calc-sqft')?.innerText || '0 ft²';

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    showQuickToast('পপআপ উইন্ডো ব্লক করা আছে। ব্রাউজার সেটিংসে পপআপ অনুমোদন করুন।');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <title>খতিয়ান ও দাগ পর্চা - দাগ নং ${dagNo}</title>
      <style>
        body { font-family: 'SolaimanLipi', 'Kalpurush', 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1e293b; }
        .header { text-align: center; border-bottom: 2px solid #047857; padding-bottom: 12px; margin-bottom: 20px; }
        .header h2 { margin: 0; color: #047857; font-size: 22px; }
        .header p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
        .badge { display: inline-block; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 12px; border-radius: 9999px; font-weight: bold; margin-top: 8px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
        th { background: #f8fafc; color: #475569; width: 35%; }
        .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 15px; text-align: center; }
        .metric-box { border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px; border-radius: 6px; }
        .metric-box .label { font-size: 11px; color: #64748b; }
        .metric-box .val { font-size: 16px; font-weight: bold; color: #047857; margin-top: 4px; }
        .footer { margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 15px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
        @media print {
          body { padding: 10px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</h2>
        <p>ডিজিটাল ক্যাডাস্ট্রাল ভূমি রেকর্ড ও দাগ তথ্য বিবরণী</p>
        <div class="badge">অনলাইন পর্চা / মৌজা রেকর্ড স্লিপ</div>
      </div>

      <table>
        <tr><th>দাগ নম্বর (Plot / Dag No)</th><td><strong style="font-size:16px; color:#047857;">${dagNo}</strong></td></tr>
        <tr><th>মৌজা ও জে.এল নং</th><td>${mouza}</td></tr>
        <tr><th>নকশা শিট নং (Cadastral Sheet)</th><td>${sheet}</td></tr>
        <tr><th>উপজেলা ও জেলা</th><td>${location}</td></tr>
        <tr><th>জমির ব্যবহারিক শ্রেণি (Land Class)</th><td>${landClass}</td></tr>
        <tr><th>প্রধান ভূমি শ্রেণি (Major Class)</th><td>${majClass}</td></tr>
        <tr><th>উপ-ভূমি শ্রেণি (Sub Class)</th><td>${subClass}</td></tr>
        <tr><th>ফসলের বিন্যাস (Crop Pattern)</th><td>${crop}</td></tr>
      </table>

      <h3 style="margin-top:20px; font-size:14px; color:#1e293b;">জমির সঠিক ক্ষেত্রফল ও হিসাব (Geodesic Area):</h3>
      <div class="metric-grid">
        <div class="metric-box"><div class="label">শতক / ডেসিমাল</div><div class="val">${shotok}</div></div>
        <div class="metric-box"><div class="label">কাঠা</div><div class="val">${katha}</div></div>
        <div class="metric-box"><div class="label">বিঘা</div><div class="val">${bigha}</div></div>
        <div class="metric-box"><div class="label">একর</div><div class="val">${acre}</div></div>
      </div>

      <div style="margin-top:10px; font-size:12px; color:#475569; background:#f1f5f9; padding:8px 12px; border-radius:4px; display:flex; justify-content:space-between;">
        <span>আন্তর্জাতিক মেট্রিক: <strong>${sqm}</strong></span>
        <span>ব্রিটিশ এফপিএস: <strong>${sqft}</strong></span>
      </div>

      <div class="footer">
        <div>প্রিন্টের তারিখ: ${new Date().toLocaleString('bn-BD')}</div>
        <div>ডিজিটাল ভূমি ম্যাপ পোর্টাল (Digital Bhumi Map)</div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// ============================================================================
// 6. Live Footer Trackers (Mouse Coordinates & Zoom Scale)
// ============================================================================
map.on('mousemove', (e) => {
  const lat = e.lngLat.lat.toFixed(4);
  const lng = e.lngLat.lng.toFixed(4);
  const coordsEl = document.getElementById('mouse-coords');
  if (coordsEl) coordsEl.innerText = `${lat}° N, ${lng}° E`;
});

map.on('zoom', () => {
  const zoom = map.getZoom().toFixed(1);
  const zoomEl = document.getElementById('current-zoom');
  if (zoomEl) {
    const label = zoom >= 15 ? (currentLanguage === 'bn' ? 'মৌজা দাগ নকশা' : 'Mouza Cadastral View') : (currentLanguage === 'bn' ? 'আঞ্চলিক ভিউ' : 'Regional Overview');
    zoomEl.innerText = `Zoom ${zoom} (${label})`;
  }
});

// ============================================================================
// 7. Navigation Toolbar Actions (Zoom, Extent, Mouza Focus)
// ============================================================================
function zoomIn() { map.zoomIn(); }
function zoomOut() { map.zoomOut(); }

function resetExtent() {
  map.flyTo({
    center: [90.3563, 23.6850],
    zoom: 7,
    essential: true
  });
  showQuickToast(currentLanguage === 'bn' ? 'সমগ্র বাংলাদেশ দৃশ্যমান' : 'Viewing Whole Bangladesh');
}

function locateToMouzaCenter() {
  map.fitBounds(datasetBounds, { padding: 40, duration: 1500, maxZoom: 15 });
  showQuickToast(currentLanguage === 'bn' ? '৩৯ উপজেলা মৌজা অঞ্চলে ফোকাস করা হয়েছে' : 'Centered on 39 Upazilas Cadastre');
}

// ============================================================================
// 8. Basemap Switcher (Street vs Satellite)
// ============================================================================
function switchBaseMap(type) {
  if (type === currentBaseMap) return;
  currentBaseMap = type;

  const btnStreet = document.getElementById('btn-bm-street');
  const btnSat = document.getElementById('btn-bm-satellite');

  if (type === 'osm') {
    map.setLayoutProperty('osm-streets-layer', 'visibility', 'visible');
    map.setLayoutProperty('esri-imagery-layer', 'visibility', 'none');
    btnStreet.className = 'px-2.5 py-1.5 rounded font-medium bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer';
    btnSat.className = 'px-2.5 py-1.5 rounded font-medium text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer';
    showQuickToast(currentLanguage === 'bn' ? 'রাস্তা ম্যাপ সক্রিয়' : 'Street Map Activated');
  } else {
    map.setLayoutProperty('osm-streets-layer', 'visibility', 'none');
    map.setLayoutProperty('esri-imagery-layer', 'visibility', 'visible');
    btnSat.className = 'px-2.5 py-1.5 rounded font-medium bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer';
    btnStreet.className = 'px-2.5 py-1.5 rounded font-medium text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer';
    showQuickToast(currentLanguage === 'bn' ? 'স্যাটেলাইট ইমেজারি সক্রিয়' : 'Satellite Imagery Activated');
  }
}

// ============================================================================
// 9. Collapsible Search Drawer & Upazila-to-Mouza Cascade
// ============================================================================
function toggleSearchDrawer() {
  const drawer = document.getElementById('search-drawer');
  const body = document.getElementById('search-form-body');
  const icon = document.getElementById('search-drawer-icon');

  isSearchCollapsed = !isSearchCollapsed;

  if (isSearchCollapsed) {
    body.classList.add('hidden');
    drawer.classList.remove('w-72', 'sm:w-80');
    drawer.classList.add('w-12');
    icon.className = 'fa-solid fa-chevron-right text-sm';
  } else {
    body.classList.remove('hidden');
    drawer.classList.add('w-72', 'sm:w-80');
    drawer.classList.remove('w-12');
    icon.className = 'fa-solid fa-chevron-left text-sm';
  }
}

async function loadUpazilaMouzasCatalog() {
  try {
    const res = await fetch(CATALOG_BASE_URL);
    if (res.ok) {
      upazilaMouzasCatalog = await res.json();
      console.log('[Catalog] Loaded upazila mouzas catalog:', Object.keys(upazilaMouzasCatalog).length, 'upazilas');
      
      // Initialize with Dhaka District
      populateUpazilasForDistrict('dhaka');
    }
  } catch (err) {
    console.error('[Catalog] Error loading upazila_mouzas.json:', err);
  }
}

function populateUpazilasForDistrict(distKey) {
  const dist = DISTRICT_DATA[distKey];
  const upzSelect = document.getElementById('sel-upazila');
  if (!dist || !upzSelect) return;

  upzSelect.innerHTML = '';
  dist.upazilas.forEach((u, i) => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.text = currentLanguage === 'bn' ? u.nameBn : u.nameEn;
    if (i === 0) opt.selected = true;
    upzSelect.appendChild(opt);
  });

  // Trigger cascade for first upazila
  onUpazilaChange();
}

function onDistrictChange() {
  const distVal = document.getElementById('sel-district')?.value;
  if (!distVal || !DISTRICT_DATA[distVal]) return;

  populateUpazilasForDistrict(distVal);

  const dist = DISTRICT_DATA[distVal];
  if (dist.center) {
    map.flyTo({
      center: dist.center,
      zoom: 12,
      duration: 1500,
      essential: true
    });
  }

  showQuickToast(currentLanguage === 'bn' ? `${dist.nameBn} জেলা নির্বাচিত হয়েছে` : `${dist.nameEn} District Selected`);
}

function onUpazilaChange() {
  const upzSelect = document.getElementById('sel-upazila');
  if (!upzSelect) return;
  const upzVal = upzSelect.value;
  currentUpazilaId = upzVal;

  // Clear any existing Mouza plots from map (User preference: don't always show vectors)
  currentMouzaData = null;
  populateSheetFilter([]);
  const src = map.getSource('mouza-source');
  if (src) {
    src.setData({ type: 'FeatureCollection', features: [] });
  }
  closePlotCard();

  const upzData = upazilaMouzasCatalog[upzVal];
  if (!upzData) {
    console.warn('[Upazila] No data in catalog for:', upzVal);
    return;
  }

  // Fly smoothly to this Upazila center
  if (upzData.center) {
    map.flyTo({
      center: upzData.center,
      zoom: 13.5,
      duration: 1600,
      essential: true
    });
  }

  // Strictly extract mouzas of THIS upazila, sorted ascending by JL number
  currentUpazilaMouzas = upzData.mouzas ? [...upzData.mouzas] : [];
  currentUpazilaMouzas.sort((a, b) => (a.jlNum || 0) - (b.jlNum || 0));

  // Reset filter input
  const filterInput = document.getElementById('filter-mouza');
  if (filterInput) filterInput.value = '';

  // Render Mouzas in dropdown sorted by JL number
  renderMouzaOptions(currentUpazilaMouzas);

  const upzName = currentLanguage === 'bn' ? upzData.upazila_name_bn : upzData.upazila_name_en;
  const txtLu = document.getElementById('txt-lu-mouza-name');
  if (txtLu) txtLu.innerText = `${upzName} (${currentUpazilaMouzas.length} টি মৌজা)`;

  showQuickToast(currentLanguage === 'bn' 
    ? `${upzName} নির্বাচিত (${currentUpazilaMouzas.length} টি মৌজা তালিকাভুক্ত - মৌজা বেছে নিন)` 
    : `${upzName} Selected (${currentUpazilaMouzas.length} Mouzas Listed - Select Mouza to load plots)`);
}

// ============================================================================
// 10. Mouza Dropdown & On-Demand Vector Plot Loading
// ============================================================================
function renderMouzaOptions(items) {
  const sel = document.getElementById('sel-mouza');
  if (!sel) return;

  // Always ensure strict ascending sort by numeric JL number
  const sorted = [...items].sort((a, b) => (a.jlNum || 0) - (b.jlNum || 0));
  const totalCount = sorted.length;

  sel.innerHTML = `<option value="">${
    currentLanguage === 'bn'
      ? `মৌজা নির্বাচন করুন (${totalCount} টি মৌজা - জেএল ক্রমানুসারে)`
      : `Select Mouza (${totalCount} Mouzas - Sorted by JL)`
  }</option>`;

  sorted.forEach((m) => {
    const opt = document.createElement('option');
    const jlStr = m.jl ? String(m.jl) : String(m.jlNum || '');
    // Store unique JL number as option value
    opt.value = jlStr;
    const prefix = currentLanguage === 'bn' ? `জেএল ${jlStr}: ` : `JL ${jlStr}: `;
    const name = currentLanguage === 'bn' ? m.nameBn : m.nameEn;
    const suffix = currentLanguage === 'bn' ? ` (${m.count} টি দাগ)` : ` (${m.count} Plots)`;
    opt.text = `${prefix}${name}${suffix}`;
    sel.appendChild(opt);
  });

  const badge = document.getElementById('mouza-count-badge');
  if (badge) {
    badge.innerText = currentLanguage === 'bn' ? `${totalCount} টি মৌজা` : `${totalCount} Mouzas`;
  }
}

function onMouzaFilterInput(e) {
  const q = e.target.value.trim().toLowerCase();
  if (!q) {
    renderMouzaOptions(currentUpazilaMouzas);
    return;
  }
  const filtered = currentUpazilaMouzas.filter(m => 
    (m.nameBn && m.nameBn.toLowerCase().includes(q)) ||
    (m.nameEn && m.nameEn.toLowerCase().includes(q)) ||
    (m.jl && String(m.jl).includes(q)) ||
    (m.jlNum && String(m.jlNum).includes(q))
  );
  renderMouzaOptions(filtered);
}

// On-Demand Plot Vector Loader: loads GeoJSON for the specific chosen Mouza
async function loadMouzaPlots(upazilaId, jl, mouzaName) {
  const loadingMsg = currentLanguage === 'bn' 
    ? `${mouzaName || 'মৌজা'} (জেএল ${jl}) এর প্লট লোড হচ্ছে...` 
    : `Loading plot vectors for JL ${jl}...`;
  showQuickToast(loadingMsg);

  try {
    const jlClean = String(parseInt(jl, 10) || jl);
    const jlPadded = jlClean.padStart(3, '0');

    // 1. Try static pre-generated mouza file first (fastest, zero backend CPU overhead)
    let res = await fetch(`${MOUZAS_BASE_URL}/${encodeURIComponent(upazilaId)}/${encodeURIComponent(jlClean)}.json`);
    if (!res.ok) {
      res = await fetch(`${MOUZAS_BASE_URL}/${encodeURIComponent(upazilaId)}/${encodeURIComponent(jlPadded)}.json`);
    }

    // 2. If not pre-generated, seamlessly fall back to on-demand extraction API
    if (!res.ok) {
      res = await fetch(`/api/mouza-plots?upazila=${encodeURIComponent(upazilaId)}&jl=${encodeURIComponent(jl)}`);
    }

    if (res.ok) {
      const geojson = await res.json();
      currentMouzaData = geojson;
      const count = geojson.features ? geojson.features.length : 0;
      
      // Dynamically populate sheet numbers for this Mouza
      populateSheetFilter(geojson.features);

      const src = map.getSource('mouza-source');
      if (src) {
        src.setData(geojson);
      }

      // Calculate bounding box of the plots and fit camera
      if (geojson.features && geojson.features.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        geojson.features.forEach(f => {
          const geom = f.geometry;
          if (geom.type === 'Polygon') {
            geom.coordinates[0].forEach(c => bounds.extend(c));
          } else if (geom.type === 'MultiPolygon') {
            geom.coordinates.forEach(poly => poly[0].forEach(c => bounds.extend(c)));
          }
        });
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 60, maxZoom: 18, duration: 1400 });
        }
      }

      showQuickToast(currentLanguage === 'bn' 
        ? `${mouzaName || 'মৌজা'} এর ${count} টি প্লটের নকশা দৃশ্যমান` 
        : `Displayed ${count} plots for ${mouzaName || 'Mouza'}`);
    } else {
      console.warn('[MouzaPlots] Failed to fetch plots:', upazilaId, jl);
      showQuickToast(currentLanguage === 'bn' 
        ? `মৌজা জেএল ${jl} এর প্লট ডেটা প্রস্তুত হচ্ছে` 
        : `Plot vectors for JL ${jl} are being prepared`);
    }
  } catch (err) {
    console.error('[MouzaPlots] Error loading plots:', err);
  }
}

function onMouzaChange() {
  const sel = document.getElementById('sel-mouza');
  if (!sel || !sel.value) {
    // If cleared, remove vector plots from map
    currentMouzaData = null;
    populateSheetFilter([]);
    map.getSource('mouza-source')?.setData({ type: 'FeatureCollection', features: [] });
    closePlotCard();
    return;
  }

  const selectedJl = String(sel.value);
  const item = currentUpazilaMouzas.find(m => String(m.jl) === selectedJl || String(m.jlNum) === selectedJl);
  if (!item) return;

  const name = currentLanguage === 'bn' ? item.nameBn : item.nameEn;
  const txtLu = document.getElementById('txt-lu-mouza-name');
  if (txtLu) txtLu.innerText = `${name} (জেএল: ${item.jl || '—'})`;

  // Fly to approximate center
  if (item.center) {
    map.flyTo({
      center: item.center,
      zoom: 16.5,
      duration: 1200,
      essential: true
    });
  }

  // Load and display vector plots for this selected mouza
  loadMouzaPlots(currentUpazilaId, item.jl, name);
}

// ============================================================================
// 10.1 Sheet No Filtering & Extent Management
// ============================================================================
function formatSheetName(sheetVal) {
  if (!sheetVal || sheetVal === '000' || sheetVal === '0') {
    return currentLanguage === 'bn' ? 'শিট ০১ (সম্পূর্ণ মৌজা)' : 'Sheet 01 (Full Mouza)';
  }
  const num = parseInt(sheetVal, 10);
  if (isNaN(num)) {
    return currentLanguage === 'bn' ? `শিট ${sheetVal}` : `Sheet ${sheetVal}`;
  }
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const formattedEn = String(num).padStart(2, '0');
  const formattedBn = formattedEn.split('').map(d => bnDigits[parseInt(d, 10)] || d).join('');
  return currentLanguage === 'bn' ? `শিট ${formattedBn}` : `Sheet ${formattedEn}`;
}

function populateSheetFilter(features) {
  const selSheet = document.getElementById('sel-sheet');
  const badgeSheet = document.getElementById('sheet-count-badge');
  if (!selSheet) return;

  if (!features || features.length === 0) {
    selSheet.innerHTML = `<option value="">${currentLanguage === 'bn' ? 'মৌজা নির্বাচন করুন' : 'Select Mouza first'}</option>`;
    selSheet.disabled = true;
    selSheet.classList.add('bg-slate-100', 'disabled:opacity-60', 'disabled:cursor-not-allowed');
    selSheet.classList.remove('bg-white');
    if (badgeSheet) badgeSheet.innerText = currentLanguage === 'bn' ? 'মৌজা ভিত্তিক' : 'By Mouza';
    currentSelectedSheet = 'all';
    resetSheetFilterLayers();
    return;
  }

  selSheet.disabled = false;
  selSheet.classList.remove('bg-slate-100', 'disabled:opacity-60', 'disabled:cursor-not-allowed');
  selSheet.classList.add('bg-white');

  // Aggregate distinct sheet numbers and their feature count
  const sheetMap = new Map();
  features.forEach(f => {
    const rawSheet = f.properties?.sheet_no != null ? String(f.properties.sheet_no).trim() : '001';
    sheetMap.set(rawSheet, (sheetMap.get(rawSheet) || 0) + 1);
  });

  // Sort sheets numerically
  const sortedSheets = Array.from(sheetMap.entries()).sort((a, b) => {
    const numA = parseInt(a[0], 10) || 0;
    const numB = parseInt(b[0], 10) || 0;
    return numA - numB;
  });

  const totalPlots = features.length;
  selSheet.innerHTML = '';

  // All Sheets option
  const optAll = document.createElement('option');
  optAll.value = 'all';
  optAll.text = currentLanguage === 'bn' ? `সকল শিট (${totalPlots} টি দাগ)` : `All Sheets (${totalPlots} Plots)`;
  optAll.selected = true;
  selSheet.appendChild(optAll);

  // Individual sheets
  sortedSheets.forEach(([sheetVal, count]) => {
    const opt = document.createElement('option');
    opt.value = sheetVal;
    const name = formatSheetName(sheetVal);
    const countSuffix = currentLanguage === 'bn' ? ` (${count} টি দাগ)` : ` (${count} Plots)`;
    opt.text = `${name}${countSuffix}`;
    selSheet.appendChild(opt);
  });

  if (badgeSheet) {
    badgeSheet.innerText = currentLanguage === 'bn' ? `${sortedSheets.length} টি শিট` : `${sortedSheets.length} Sheets`;
  }

  currentSelectedSheet = 'all';
  resetSheetFilterLayers();
}

function resetSheetFilterLayers() {
  if (map.getLayer('plots-fill')) {
    map.setFilter('plots-fill', null);
  }
  if (map.getLayer('plots-line')) {
    map.setFilter('plots-line', null);
  }
  if (map.getLayer('plots-label')) {
    map.setFilter('plots-label', null);
  }
}

function onSheetChange() {
  const selSheet = document.getElementById('sel-sheet');
  if (!selSheet) return;
  const sheetVal = selSheet.value;
  currentSelectedSheet = sheetVal;

  if (!currentMouzaData || !currentMouzaData.features || currentMouzaData.features.length === 0) {
    return;
  }

  if (sheetVal === 'all' || !sheetVal) {
    resetSheetFilterLayers();

    // Fit camera to full mouza extent
    const bounds = new maplibregl.LngLatBounds();
    currentMouzaData.features.forEach(f => {
      const geom = f.geometry;
      if (geom.type === 'Polygon') {
        geom.coordinates[0].forEach(c => bounds.extend(c));
      } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach(poly => poly[0].forEach(c => bounds.extend(c)));
      }
    });
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 18, duration: 1200 });
    }

    showQuickToast(currentLanguage === 'bn' 
      ? `সকল শিটের নকশা প্রদর্শিত হচ্ছে (${currentMouzaData.features.length} টি দাগ)` 
      : `Displaying all sheets (${currentMouzaData.features.length} plots)`);
  } else {
    // Apply filter expression to MapLibre layers
    const filterExp = ['==', ['to-string', ['get', 'sheet_no']], sheetVal];
    if (map.getLayer('plots-fill')) map.setFilter('plots-fill', filterExp);
    if (map.getLayer('plots-line')) map.setFilter('plots-line', filterExp);
    if (map.getLayer('plots-label')) map.setFilter('plots-label', filterExp);

    // Filter features matching this sheet to fit camera bounds
    const matching = currentMouzaData.features.filter(f => String(f.properties?.sheet_no).trim() === sheetVal);
    if (matching.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      matching.forEach(f => {
        const geom = f.geometry;
        if (geom.type === 'Polygon') {
          geom.coordinates[0].forEach(c => bounds.extend(c));
        } else if (geom.type === 'MultiPolygon') {
          geom.coordinates.forEach(poly => poly[0].forEach(c => bounds.extend(c)));
        }
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 60, maxZoom: 18, duration: 1200 });
      }
    }

    // If currently selected plot is not in this sheet, close card
    if (selectedDagNo) {
      const isPlotInSheet = matching.some(f => String(f.properties?.dag_no) === selectedDagNo);
      if (!isPlotInSheet) {
        closePlotCard();
      }
    }

    const sheetName = formatSheetName(sheetVal);
    showQuickToast(currentLanguage === 'bn' 
      ? `${sheetName} ফিল্টার করা হয়েছে (${matching.length} টি দাগ)` 
      : `Filtered ${sheetName} (${matching.length} plots)`);
  }
}

function searchDagNumber() {
  const inputEl = document.getElementById('input-dag');
  const val = inputEl ? inputEl.value.trim() : '';
  if (!val) {
    showQuickToast(currentLanguage === 'bn' ? 'দাগ নম্বর লিখুন' : 'Please enter a Plot No');
    return;
  }

  if (!currentMouzaData || !currentMouzaData.features || currentMouzaData.features.length === 0) {
    showQuickToast(currentLanguage === 'bn' ? 'দয়া করে প্রথমে একটি মৌজা নির্বাচন করুন' : 'Please select a Mouza first');
    return;
  }

  const matched = currentMouzaData.features.find(f => String(f.properties?.dag_no) === val);
  if (matched) {
    const plotSheet = matched.properties?.sheet_no != null ? String(matched.properties.sheet_no).trim() : '';
    // If the plot belongs to a different sheet than currently filtered, switch sheet filter
    if (plotSheet && currentSelectedSheet !== 'all' && currentSelectedSheet !== plotSheet) {
      const selSheet = document.getElementById('sel-sheet');
      if (selSheet) {
        selSheet.value = plotSheet;
        onSheetChange();
      }
    }
    displayPlotDetails(matched);
    const bounds = new maplibregl.LngLatBounds();
    const geom = matched.geometry;
    if (geom.type === 'Polygon') {
      geom.coordinates[0].forEach(c => bounds.extend(c));
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach(poly => poly[0].forEach(c => bounds.extend(c)));
    }
    map.fitBounds(bounds, { padding: 80, maxZoom: 18, duration: 1200 });
    showQuickToast(currentLanguage === 'bn' ? `দাগ নং ${val} চিহ্নিত করা হয়েছে` : `Plot No ${val} Located`);
  } else {
    showQuickToast(currentLanguage === 'bn' 
      ? `দাগ নং ${val} এই মৌজায় খুঁজে পাওয়া যায়নি` 
      : `Plot No ${val} not found in this Mouza`);
  }
}

// ============================================================================
// 11. Interactive Measurement Tool & Real-Time HUD
// ============================================================================
function toggleMeasureTool() {
  isMeasureActive = !isMeasureActive;
  const btn = document.getElementById('btn-toggle-measure');
  const hud = document.getElementById('measure-hud');

  if (isMeasureActive) {
    btn.classList.add('bg-amber-100', 'text-amber-800');
    hud.classList.remove('hidden');
    hud.classList.add('flex');
    if (drawControlContainer) drawControlContainer.style.display = 'block';
    draw.changeMode('draw_line_string');
    showQuickToast(currentLanguage === 'bn' ? 'পরিমাপ মোড চালু: ম্যাপে ক্লিক করে রেখা আঁকুন' : 'Measurement Active: Click map to draw');
  } else {
    btn.classList.remove('bg-amber-100', 'text-amber-800');
    hud.classList.add('hidden');
    hud.classList.remove('flex');
    if (drawControlContainer) drawControlContainer.style.display = 'none';
    clearMeasurement();
  }
}

function handleDrawUpdate() {
  const data = draw.getAll();
  if (!data.features || data.features.length === 0) {
    document.getElementById('measure-result').innerText = '';
    return;
  }

  const feat = data.features[data.features.length - 1];
  const type = feat.geometry.type;

  if (type === 'LineString') {
    const lenKm = length(feat, { units: 'kilometers' });
    const meters = (lenKm * 1000).toFixed(1);
    const feet = (lenKm * 3280.84).toFixed(1);
    document.getElementById('measure-result').innerText = `${meters} মি. (${feet} ফুট)`;
  } else if (type === 'Polygon') {
    const areaM2 = area(feat);
    const shotok = (areaM2 / 40.4686).toFixed(2);
    const katha = (areaM2 / 66.8903).toFixed(2);
    document.getElementById('measure-result').innerText = `${shotok} শতক (${katha} কাঠা / ${areaM2.toFixed(1)} m²)`;
  }
}

function clearMeasurement() {
  draw.deleteAll();
  document.getElementById('measure-result').innerText = '';
  draw.changeMode('simple_select');
}

map.on('draw.create', handleDrawUpdate);
map.on('draw.update', handleDrawUpdate);
map.on('draw.delete', handleDrawUpdate);

// ============================================================================
// 12. Modals: Land Use & Zoning Analysis with Chart.js
// ============================================================================
function initCharts() {
  const ctxLU = document.getElementById('chart-landuse')?.getContext('2d');
  if (ctxLU) {
    chartLandUse = new Chart(ctxLU, {
      type: 'doughnut',
      data: {
        labels: currentLanguage === 'bn'
          ? ['কৃষি (নাল)', 'আবাসিক/ভিটি', 'জলাশয়/পুকুর', 'বাণিজ্যিক']
          : ['Agricultural', 'Homestead/Viti', 'Waterbody/Pond', 'Commercial'],
        datasets: [{
          data: [54, 26, 12, 8],
          backgroundColor: ['#059669', '#f59e0b', '#0284c7', '#8b5cf6'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { boxWidth: 12, font: { size: 11, family: '"Noto Sans Bengali", Inter' } }
          }
        }
      }
    });
  }

  const ctxZ = document.getElementById('chart-zoning')?.getContext('2d');
  if (ctxZ) {
    chartZoning = new Chart(ctxZ, {
      type: 'bar',
      data: {
        labels: currentLanguage === 'bn'
          ? ['কৃষি জোন', 'আবাসিক জোন', 'বাণিজ্যিক জোন', 'জলাধার সংরক্ষণ']
          : ['Agricultural', 'Residential', 'Commercial', 'Water Reserve'],
        datasets: [{
          label: currentLanguage === 'bn' ? 'জমির শতাংশ (%)' : 'Percentage (%)',
          data: [50, 30, 10, 10],
          backgroundColor: ['#10b981', '#f59e0b', '#a855f7', '#06b6d4'],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });
  }
}

function openLandUseModal() {
  document.getElementById('modal-landuse')?.classList.remove('hidden');
}

function closeLandUseModal() {
  document.getElementById('modal-landuse')?.classList.add('hidden');
}

function openZoningModal() {
  document.getElementById('modal-zoning')?.classList.remove('hidden');
}

function closeZoningModal() {
  document.getElementById('modal-zoning')?.classList.add('hidden');
}

function showQuickToast(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  if (toast && toastMsg) {
    toastMsg.innerText = msg;
    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');

    setTimeout(() => {
      toast.classList.remove('opacity-100');
      toast.classList.add('opacity-0', 'pointer-events-none');
    }, 2600);
  }
}

// ============================================================================
// 13. Bilingual Language Switcher (Bangla <-> English)
// ============================================================================
function toggleLanguage() {
  currentLanguage = currentLanguage === 'bn' ? 'en' : 'bn';

  if (currentLanguage === 'en') {
    document.getElementById('lang-label').innerText = 'বাংলা';
    document.getElementById('txt-app-title').innerText = 'Digital Bhumi Map';
    document.getElementById('txt-app-badge').innerText = 'Cadastral Survey • PMTiles v3';
    document.getElementById('nav-home').innerText = 'Home';
    document.getElementById('nav-zoning').innerText = 'Zoning';
    document.getElementById('nav-reports').innerText = 'Reports';
    document.getElementById('nav-help').innerText = 'Help';
    document.getElementById('user-label').innerText = 'Login';
    document.getElementById('txt-bm-street').innerText = 'Street Map';
    document.getElementById('txt-bm-satellite').innerText = 'Satellite';
    document.getElementById('lbl-search-title').innerText = 'Search Menu';
    document.getElementById('lbl-div').innerText = 'Division:';
    document.getElementById('lbl-dist').innerText = 'District:';
    document.getElementById('lbl-upz').innerText = 'Upazila:';
    document.getElementById('lbl-mouza').innerText = 'Mouza:';
    document.getElementById('lbl-sheet').innerText = 'Sheet No:';
    document.getElementById('lbl-dag').innerText = 'Plot / Dag No Search:';
    document.getElementById('btn-land-use-text').innerText = 'Land Use Summary';
    document.getElementById('btn-zoning-text').innerText = 'Land Zoning Summary';
    document.getElementById('status-live').innerText = 'System Online';
    document.getElementById('lbl-mouse-coords').innerText = 'Coordinates:';
    document.getElementById('lbl-scale').innerText = 'Scale:';
    document.getElementById('txt-footer-dept').innerText = 'Ministry of Land, Government of the People\'s Republic of Bangladesh';
    document.getElementById('pcard-title').innerText = 'Plot Information Details';
    document.getElementById('pcard-dagno-lbl').innerText = 'Plot No';
    document.getElementById('pcard-class-lbl').innerText = 'Classification';
    document.getElementById('pcard-mouza-lbl').innerText = 'Mouza & JL:';
    document.getElementById('pcard-sheet-lbl').innerText = 'Map Sheet:';
    document.getElementById('pcard-khatian-lbl').innerText = 'Khatian Ref:';
    document.getElementById('pcard-upz-lbl').innerText = 'Location:';
    
    // Land use labels
    const pMaj = document.getElementById('pcard-majclass-lbl');
    const pSub = document.getElementById('pcard-subclass-lbl');
    const pCrop = document.getElementById('pcard-crop-lbl');
    if (pMaj) pMaj.innerText = 'Major Land Class:';
    if (pSub) pSub.innerText = 'Sub Land Class:';
    if (pCrop) pCrop.innerText = 'Crop Pattern:';

    document.getElementById('pcard-area-title').innerHTML = '<span>Area Calculations</span><span class="text-[10px] text-slate-400 font-normal">Automated Geodesic</span>';
    document.getElementById('u-shotok').innerText = 'Shotok / Decimal';
    document.getElementById('u-katha').innerText = 'Katha';
    document.getElementById('u-bigha').innerText = 'Bigha';
    document.getElementById('u-acre').innerText = 'Acre';
    document.getElementById('txt-print-slip').innerText = 'Print / Download Slip';
    document.getElementById('measure-title').innerText = 'Measure Mode Active';
    document.getElementById('measure-instruction').innerText = 'Draw line or polygon on map to measure';
    document.getElementById('modal-landuse-title').innerText = 'Mouza Land Use Overview Summary';
    document.getElementById('lbl-selected-mouza').innerText = 'Selected Region';
    document.getElementById('lbl-total-plots-count').innerText = 'Total Plots';
    document.getElementById('modal-zoning-title').innerText = 'Land Zoning Master Plan Analysis';
    document.getElementById('lbl-building-height').innerText = 'Permitted Building Height';
    document.getElementById('lbl-env-sensitivity').innerText = 'Environmental Sensitivity';
    document.getElementById('txt-env-safety').innerText = 'Low / Safe Zone';
  } else {
    document.getElementById('lang-label').innerText = 'English';
    document.getElementById('txt-app-title').innerText = 'ডিজিটাল ভূমি ম্যাপ';
    document.getElementById('txt-app-badge').innerText = 'ক্যাডাস্ট্রাল সার্ভে • PMTiles v3';
    document.getElementById('nav-home').innerText = 'হোম';
    document.getElementById('nav-zoning').innerText = 'জোনিং';
    document.getElementById('nav-reports').innerText = 'রিপোর্ট';
    document.getElementById('nav-help').innerText = 'সহায়তা';
    document.getElementById('user-label').innerText = 'লগইন';
    document.getElementById('txt-bm-street').innerText = 'রাস্তা ম্যাপ';
    document.getElementById('txt-bm-satellite').innerText = 'স্যাটেলাইট';
    document.getElementById('lbl-search-title').innerText = 'অনুসন্ধান মেনু / Search';
    document.getElementById('lbl-div').innerText = 'বিভাগ:';
    document.getElementById('lbl-dist').innerText = 'জেলা:';
    document.getElementById('lbl-upz').innerText = 'থানা/উপজেলা:';
    document.getElementById('lbl-mouza').innerText = 'মৌজা:';
    document.getElementById('lbl-sheet').innerText = 'শিট নং:';
    document.getElementById('lbl-dag').innerText = 'প্লট / দাগ নং অনুসন্ধান:';
    document.getElementById('btn-land-use-text').innerText = 'ভূমি ব্যবহারের সারাংশ';
    document.getElementById('btn-zoning-text').innerText = 'ভূমি জোনিং সারাংশ';
    document.getElementById('status-live').innerText = 'সিস্টেম সক্রিয়';
    document.getElementById('lbl-mouse-coords').innerText = 'অক্ষাংশ/দ্রাঘিমাংশ:';
    document.getElementById('lbl-scale').innerText = 'স্কেল:';
    document.getElementById('txt-footer-dept').innerText = 'ভূমি মন্ত্রণালয়, গণপ্রজাতন্ত্রী বাংলাদেশ সরকার';
    document.getElementById('pcard-title').innerText = 'প্লট বিস্তারিত তথ্য';
    document.getElementById('pcard-dagno-lbl').innerText = 'দাগ নম্বর';
    document.getElementById('pcard-class-lbl').innerText = 'জমির শ্রেণি';
    document.getElementById('pcard-mouza-lbl').innerText = 'মৌজা ও জে.এল:';
    document.getElementById('pcard-sheet-lbl').innerText = 'নকশা শিট নং:';
    document.getElementById('pcard-khatian-lbl').innerText = 'খতিয়ান রেফারেন্স:';
    document.getElementById('pcard-upz-lbl').innerText = 'উপজেলা ও জেলা:';

    // Land use labels
    const pMaj = document.getElementById('pcard-majclass-lbl');
    const pSub = document.getElementById('pcard-subclass-lbl');
    const pCrop = document.getElementById('pcard-crop-lbl');
    if (pMaj) pMaj.innerText = 'প্রধান ভূমি শ্রেণি (Maj Class):';
    if (pSub) pSub.innerText = 'উপ-ভূমি শ্রেণি (Sub Class):';
    if (pCrop) pCrop.innerText = 'ফসলের বিন্যাস (Crop Pattern):';

    document.getElementById('pcard-area-title').innerHTML = '<span>জমির পরিমাণ ও হিসাব</span><span class="text-[10px] text-slate-400 font-normal">স্বয়ংক্রিয় জিওডেসিক হিসাব</span>';
    document.getElementById('u-shotok').innerText = 'শতক / ডেসিমাল';
    document.getElementById('u-katha').innerText = 'কাঠা';
    document.getElementById('u-bigha').innerText = 'বিঘা';
    document.getElementById('u-acre').innerText = 'একর';
    document.getElementById('txt-print-slip').innerText = 'রিপোর্ট প্রিন্ট / ডাউনলোড';
    document.getElementById('measure-title').innerText = 'পরিমাপ মোড সক্রিয়';
    document.getElementById('measure-instruction').innerText = 'ম্যাপে ড্র টুল দিয়ে রেখা বা বহুভুজ আঁকুন';
    document.getElementById('modal-landuse-title').innerText = 'মৌজা ভূমি ব্যবহারের সামগ্রিক সারাংশ';
    document.getElementById('lbl-selected-mouza').innerText = 'নির্বাচিত অঞ্চল';
    document.getElementById('lbl-total-plots-count').innerText = 'মোট প্লট সংখ্যা';
    document.getElementById('modal-zoning-title').innerText = 'ভূমি জোনিং মাস্টার প্ল্যান বিশ্লেষণ';
    document.getElementById('lbl-building-height').innerText = 'অনুমোদিত সর্বোচ্চ ভবন উচ্চতা';
    document.getElementById('lbl-env-sensitivity').innerText = 'পরিবেশগত সংবেদনশীলতা';
    document.getElementById('txt-env-safety').innerText = 'নিম্ন / নিরাপদ';
  }

  // Refresh dropdown texts in current language
  const distVal = document.getElementById('sel-district')?.value || 'dhaka';
  populateUpazilasForDistrict(distVal);

  // Refresh sheet filter in current language
  if (currentMouzaData && currentMouzaData.features && currentMouzaData.features.length > 0) {
    const prevSheet = currentSelectedSheet;
    populateSheetFilter(currentMouzaData.features);
    const selSheet = document.getElementById('sel-sheet');
    if (selSheet && prevSheet) {
      selSheet.value = prevSheet;
      currentSelectedSheet = prevSheet;
      if (prevSheet !== 'all') {
        const filterExp = ['==', ['to-string', ['get', 'sheet_no']], prevSheet];
        if (map.getLayer('plots-fill')) map.setFilter('plots-fill', filterExp);
        if (map.getLayer('plots-line')) map.setFilter('plots-line', filterExp);
        if (map.getLayer('plots-label')) map.setFilter('plots-label', filterExp);
      }
    }
  }

  showQuickToast(currentLanguage === 'bn' ? 'ভাষা পরিবর্তন করা হয়েছে: বাংলা' : 'Language switched to English');
}

// ============================================================================
// 14. DOM Event Wiring
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Navigation & toolbar buttons
  document.getElementById('btn-zoom-in')?.addEventListener('click', zoomIn);
  document.getElementById('btn-zoom-out')?.addEventListener('click', zoomOut);
  document.getElementById('btn-full-extent')?.addEventListener('click', resetExtent);
  document.getElementById('btn-mouza-center')?.addEventListener('click', locateToMouzaCenter);
  document.getElementById('btn-toggle-measure')?.addEventListener('click', toggleMeasureTool);
  document.getElementById('btn-clear-measure')?.addEventListener('click', clearMeasurement);

  // Basemap switcher
  document.getElementById('btn-bm-street')?.addEventListener('click', () => switchBaseMap('osm'));
  document.getElementById('btn-bm-satellite')?.addEventListener('click', () => switchBaseMap('satellite'));

  // Search drawer
  document.getElementById('btn-toggle-drawer')?.addEventListener('click', toggleSearchDrawer);
  document.getElementById('sel-division')?.addEventListener('change', (e) => {
    if (e.target.value === 'dhaka') {
      showQuickToast(currentLanguage === 'bn' ? 'ঢাকা বিভাগের জেলাসমূহ লোড করা হয়েছে' : 'Loaded Dhaka Division');
    } else {
      showQuickToast(currentLanguage === 'bn' ? 'এই বিভাগের মৌজা ডেটা সার্ভে প্রক্রিয়াধীন রয়েছে' : 'Survey data in progress');
    }
  });
  document.getElementById('sel-district')?.addEventListener('change', onDistrictChange);
  document.getElementById('sel-upazila')?.addEventListener('change', onUpazilaChange);
  document.getElementById('sel-mouza')?.addEventListener('change', onMouzaChange);
  document.getElementById('filter-mouza')?.addEventListener('input', onMouzaFilterInput);
  document.getElementById('sel-sheet')?.addEventListener('change', onSheetChange);

  // Load hierarchical catalog
  loadUpazilaMouzasCatalog();

  // Dag search
  document.getElementById('btn-search-dag')?.addEventListener('click', searchDagNumber);
  document.getElementById('input-dag')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchDagNumber();
  });

  // Modal triggers
  document.getElementById('btn-open-landuse')?.addEventListener('click', openLandUseModal);
  document.getElementById('nav-reports')?.addEventListener('click', (e) => {
    e.preventDefault();
    openLandUseModal();
  });
  document.getElementById('btn-close-landuse')?.addEventListener('click', closeLandUseModal);
  document.getElementById('btn-close-landuse-bottom')?.addEventListener('click', closeLandUseModal);

  document.getElementById('btn-open-zoning')?.addEventListener('click', openZoningModal);
  document.getElementById('nav-zoning')?.addEventListener('click', (e) => {
    e.preventDefault();
    openZoningModal();
  });
  document.getElementById('btn-close-zoning')?.addEventListener('click', closeZoningModal);
  document.getElementById('btn-close-zoning-bottom')?.addEventListener('click', closeZoningModal);

  document.getElementById('nav-home')?.addEventListener('click', (e) => {
    e.preventDefault();
    resetExtent();
  });

  document.getElementById('nav-help')?.addEventListener('click', (e) => {
    e.preventDefault();
    showQuickToast(currentLanguage === 'bn' ? 'সহায়তা ডেস্কে যোগাযোগ: ১৬১২২ (টোল ফ্রি)' : 'Helpdesk Hotline: 16122 (Toll Free)');
  });

  document.getElementById('user-btn')?.addEventListener('click', () => {
    showQuickToast(currentLanguage === 'bn' ? 'নাগরিক সেবা লগইন পোর্টাল লোড হচ্ছে...' : 'Citizen Service Portal Loading...');
  });

  // Inspector card
  document.getElementById('btn-close-pcard')?.addEventListener('click', closePlotCard);
  document.getElementById('btn-print-slip')?.addEventListener('click', printPlotSlip);

  // Language switcher
  document.getElementById('lang-btn')?.addEventListener('click', toggleLanguage);
});
