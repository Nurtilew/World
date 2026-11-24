export const CITIES = [
  { name: "Алматы", country: "Қазақстан", palette: [0x2563eb, 0x10b981, 0x64748b], style: "almaty", landmark: "Көктөбе мұнарасы" },
  { name: "Дубай", country: "БАӘ", palette: [0xf59e0b, 0x38bdf8, 0xe2e8f0], style: "skyscraper", landmark: "Бурдж-Халифа" },
  { name: "Бейжің", country: "Қытай", palette: [0xdc2626, 0xfbbf24, 0x475569], style: "historic", landmark: "Аспан ғибадатханасы" },
  { name: "Сеул", country: "Оңтүстік Корея", palette: [0x3b82f6, 0x06b6d4, 0x94a3b8], style: "modern", landmark: "N Seoul Tower" },
  { name: "Нью-Йорк", country: "АҚШ", palette: [0x4f46e5, 0x64748b, 0x0ea5e9], style: "skyscraper", landmark: "Empire State" },
  { name: "Париж", country: "Франция", palette: [0xd6d3d1, 0xa8a29e, 0x38bdf8], style: "europe", landmark: "Эйфель мұнарасы" },
  { name: "Лондон", country: "Ұлыбритания", palette: [0x991b1b, 0x475569, 0x0284c7], style: "europe", landmark: "Биг-Бен" },
  { name: "Токио", country: "Жапония", palette: [0xec4899, 0x8b5cf6, 0x06b6d4], style: "neon", landmark: "Tokyo Skytree" },
  { name: "Берлин", country: "Германия", palette: [0x64748b, 0xeab308, 0x334155], style: "europe", landmark: "Fernsehturm" },
  { name: "Мадрид", country: "Испания", palette: [0xea580c, 0xfacc15, 0x78716c], style: "europe", landmark: "Король сарайы" },
  { name: "Сингапур", country: "Сингапур", palette: [0x059669, 0x0284c7, 0x38bdf8], style: "skyscraper", landmark: "Marina Bay Sands" },
  { name: "Ыстамбұл", country: "Түркия", palette: [0xd97706, 0x0d9488, 0x94a3b8], style: "historic", landmark: "Галата мұнарасы" },
  { name: "Рим", country: "Италия", palette: [0xfde68a, 0xd97706, 0x78716c], style: "europe", landmark: "Колизей" },
  { name: "Торонто", country: "Канада", palette: [0x0284c7, 0xdc2626, 0x64748b], style: "modern", landmark: "CN Tower" },
  { name: "Сидней", country: "Австралия", palette: [0x0ea5e9, 0xf8fafc, 0x14b8a6], style: "modern", landmark: "Сидней операсы" }
];

export const MISSIONS = [
  { id: 1, title: "1. Алматы курьері", desc: "Көлікпен немесе жаяу қала ішінде жеткізу тапсырысын орында.", reward: 1200, wantedGain: 0, targetDist: 140 },
  { id: 2, title: "2. Мафия қақтығысы", desc: "Қарсылас NPC-лердің кем дегенде 2-еуін жой.", reward: 2200, wantedGain: 1, targetKills: 2 },
  { id: 3, title: "3. Көпір арқылы шекара", desc: "1000м көпірден өтіп, жаңа аймаққа шық.", reward: 2800, wantedGain: 0, crossBridge: true },
  { id: 4, title: "4. Үлкен банк тонау", desc: "Банк қоймасын бұзып, қауіпсіз аймаққа шық.", reward: 5500, wantedGain: 2, heistMission: true }
];

export const GARAGE_CARS = [
  { id: "gt_coupe", name: "Turbo GT Coupe", price: 0, speed: 120, color: 0xef4444 },
  { id: "cyber_drift", name: "Cyber Drift X", price: 4500, speed: 155, color: 0x38bdf8 },
  { id: "v8_muscle", name: "V8 Phantom Muscle", price: 8000, speed: 185, color: 0xf59e0b }
];

export const RADIO_STATIONS = [
  { id: "off", name: "Радио Өшірулі", freqs: [] },
  { id: "synth", name: "Night Synth FM", freqs: [220, 277.18, 329.63, 440] },
  { id: "lofi", name: "Almaty Chill Wave", freqs: [196, 246.94, 293.66, 392] },
  { id: "action", name: "High-Octane Action", freqs: [146.83, 220, 293.66, 369.99] }
];

export const CITY_SIZE = 1800;
export const BRIDGE_LEN = 1000;
export const STEP = CITY_SIZE + BRIDGE_LEN;
