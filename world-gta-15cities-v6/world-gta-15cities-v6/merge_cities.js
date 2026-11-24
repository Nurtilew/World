const fs = require('fs');
const path = require('path');

const CITIES = [
  { id: 0, name: "Almaty", country: "Kazakhstan", source: "almaty-alatau-map-main" },
  { id: 1, name: "Dubai", country: "UAE", source: "dubai-3d-main" },
  { id: 2, name: "Beijing", country: "China", source: "beijing-3d-map-main" },
  { id: 3, name: "Seoul", country: "South Korea", source: "yonsei-ro-3d-main" },
  { id: 4, name: "New York", country: "USA", source: "undergrid-main" },
  { id: 5, name: "Paris", country: "France", source: "foundry-wod-control-room-main" },
  { id: 6, name: "London", country: "UK", source: "vantage-city-os-main" },
  { id: 7, name: "Tokyo", country: "Japan", source: "ThreeD-main" },
  { id: 8, name: "Berlin", country: "Germany", source: "u-s-bahn-main" },
  { id: 9, name: "Madrid", country: "Spain", source: "renfe-live-map-main" },
  { id: 10, name: "Singapore", country: "Singapore", source: "3D-road-map-main" },
  { id: 11, name: "Istanbul", country: "Turkey", source: "the-dons-3d-main" },
  { id: 12, name: "Rome", country: "Italy", source: "sf-family-zoning-plan-main" },
  { id: 13, name: "Toronto", country: "Canada", source: "HKMAP_3D-main" },
  { id: 14, name: "Sydney", country: "Australia", source: "MapboxGL-JS-New-York-City-Building-extrusions-master" }
];

const CITY_SIZE = 1800;
const BRIDGE_LENGTH = 1000;
const STEP = CITY_SIZE + BRIDGE_LENGTH;

const worldData = {
  bridgeLength: BRIDGE_LENGTH,
  citySize: CITY_SIZE,
  cities: CITIES.map((city, idx) => {
    const col = idx % 5;
    const row = Math.floor(idx / 5);
    const centerX = col * STEP;
    const centerZ = row * STEP;
    let importedBuildings = [];
    const zipPath = path.join(__dirname, 'raw_zips', city.source);
    if (fs.existsSync(zipPath)) {
      try {
        const files = fs.readdirSync(zipPath, { recursive: true });
        const jsonFile = files.find(f =>
          f.endsWith('buildings.json') || f.endsWith('world.json') || f.endsWith('map_data.json')
        );
        if (jsonFile) {
          const raw = JSON.parse(fs.readFileSync(path.join(zipPath, jsonFile), 'utf8'));
          if (Array.isArray(raw)) importedBuildings = raw.slice(0, 500);
        }
      } catch (e) {}
    }
    return { ...city, centerX, centerZ, importedBuildings };
  })
};

fs.writeFileSync('world_config.json', JSON.stringify(worldData, null, 2));
console.log('15 елдің 15 қаласы + 1000м көпірлер біріктірілді: world_config.json');
