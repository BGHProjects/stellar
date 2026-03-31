// Planet and body data for the Solara system.
// This is the canonical source of lore, astrophysical data, and display metadata
// used by PlanetPage, the star map side panel, and the Docusaurus docs.
//
// Orbital parameters (period, radius, eccentricity) live in system.json.
// Everything presentational and narrative lives here.

export interface SpaceportInfo {
  id:          string
  name:        string
  type:        'orbital' | 'surface' | 'atmospheric' | 'deep_space'
  description: string
}

export interface BodyRoute {
  routeId:    string
  to:         string           // body ID
  toName:     string
  shipClass:  string
  frequency:  string           // "Every X days"
  scenic:     boolean
}

export interface BodyData {
  id:           string
  name:         string
  type:         string
  parentId:     string | null   // null for planets
  parentName:   string | null
  tagline:      string
  description:  string
  lore:         string          // longer atmospheric paragraph
  atmosphere:   string | null   // "Breathable" | "Thin — pressure suits required" | "None" | "Toxic" | null
  gravity:      string          // relative to Earth, e.g. "1.4g"
  dayLength:    string          // e.g. "26.4 hours"
  temperature:  string          // e.g. "-40°C to 15°C"
  population:   string          // e.g. "~4.2 billion" or "Research colony (~800)"
  economy:      string[]        // e.g. ["Commerce", "Government", "Tourism"]
  climate:      string
  renderColor:  string
  accentColor:  string          // for CSS variable --planet-glow
  spaceports:   SpaceportInfo[]
  routes:       BodyRoute[]
  facts:        { label: string; value: string }[]
  imageSlots: {
    hero:       string          // description for image placeholder
    surface:    string
    spaceport:  string
    extra?:     string
  }
}

// ─────────────────────────────────────────────────────────────────
// Planet data
// ─────────────────────────────────────────────────────────────────

const PLANET_DATA: Record<string, BodyData> = {

  // ── AETHON ─────────────────────────────────────────────────────
  aethon: {
    id:          'aethon',
    name:        'Aethon',
    type:        'Super-Earth',
    parentId:    null,
    parentName:  null,
    tagline:     'The Heart of the System',
    description: 'The political and commercial centre of the Solara system. A super-Earth with stronger gravity, thicker atmosphere, and a civilisation that has had centuries longer to develop than anywhere else in the system.',
    lore:        'Aethon was the first world in the Solara system to achieve industrialisation and the first to reach orbit. Its head start compounds with every generation — the most sophisticated financial systems, the most advanced manufacturing, the densest academic infrastructure in the system all reside here. The planet\'s stronger gravity (1.4g) has shaped its architecture toward the horizontal: megacity sprawl that spreads laterally across continents rather than reaching skyward, interrupted only by the massive tether infrastructure of the Orbital Ring above. The Pale Season — when both stars are simultaneously above the equatorial horizon for stretches of 40+ hours — is both celebrated and dreaded. Businesses run through it. Artists are inspired by it. Residents of the higher latitudes consider it a reason never to move south.',
    atmosphere:  'Dense — fully breathable',
    gravity:     '1.4g',
    dayLength:   '26.4 hours',
    temperature: '-5°C to 38°C (equatorial)',
    population:  '~4.2 billion',
    economy:     ['Interplanetary Commerce', 'Governance & Law', 'Manufacturing', 'Financial Services', 'Tourism'],
    climate:     'Temperate to subtropical across most landmasses. Polar regions are cold but inhabited. Equatorial zones experience extreme prolonged daylight during the Pale Season.',
    renderColor: '#4A90D9',
    accentColor: 'rgba(74, 144, 217, 0.35)',
    spaceports: [
      { id: 'aethon_orbital_ring',  name: 'Aethon Orbital Ring',   type: 'orbital',      description: 'The primary deep-system terminal. A permanent structure in low orbit and the busiest spaceport in the system. Most long-haul voyages depart and arrive here.' },
      { id: 'caelum_platform',      name: 'Caelum Platform',        type: 'atmospheric',  description: 'A mid-atmosphere floating station above the equatorial zone, for atmospheric entry and exit without full surface descent. Popular with passengers connecting to orbital departures.' },
      { id: 'port_ashara',          name: 'Port Ashara',            type: 'surface',      description: 'The oldest surface spaceport on Aethon. Historically significant, northern continent. Handles heritage and diplomatic traffic alongside commercial operations.' },
      { id: 'meridian_base',        name: 'Meridian Base',          type: 'surface',      description: 'Southern hemisphere, more utilitarian and cargo-focused. The highest freight throughput of any surface port in the system.' },
      { id: 'eastgate_terminal',    name: 'Eastgate Terminal',      type: 'surface',      description: 'High-capacity commercial hub, eastern seaboard. The newest and most modern surface port, opened to relieve pressure on Port Ashara.' },
      { id: 'seren_relay',          name: 'Seren Relay Station',    type: 'orbital',      description: 'A small departure staging installation in Seren\'s orbital path. Used as a jump-off point for outer-system routes, particularly those heading through the Scatter.' },
    ],
    routes: [
      { routeId: 'aethon_kalos',          to: 'kalos',  toName: 'Kalos',  shipClass: 'Tethys',  frequency: 'Every 5 days',  scenic: false },
      { routeId: 'aethon_thal',           to: 'thal',   toName: 'Thal',   shipClass: 'Tethys',  frequency: 'Every 8 days',  scenic: false },
      { routeId: 'aethon_mira',           to: 'mira',   toName: 'Mira',   shipClass: 'Solaris', frequency: 'Every 14 days', scenic: false },
      { routeId: 'aethon_calyx',          to: 'calyx',  toName: 'Calyx',  shipClass: 'Solaris', frequency: 'Every 14 days', scenic: false },
      { routeId: 'aethon_vareth_scenic',  to: 'kalos',  toName: 'Kalos via Vareth', shipClass: 'Lunara', frequency: 'Every 21 days', scenic: true },
      { routeId: 'aethon_calyx_scenic',   to: 'calyx',  toName: 'Calyx (Scenic)',   shipClass: 'Lunara', frequency: 'Every 28 days', scenic: true },
    ],
    facts: [
      { label: 'Moons',         value: '3 (Kael, Seren, Veth)' },
      { label: 'Orbital Period',value: '380 days' },
      { label: 'Orbital Radius',value: '1.1 AU' },
      { label: 'Eccentricity',  value: '0.03' },
      { label: 'Axial Tilt',    value: '23°' },
      { label: 'Spaceports',    value: '6' },
    ],
    imageSlots: {
      hero:      'Aethon from orbit — supercontinent visible through blue atmosphere, orbital ring catching light',
      surface:   'Aethon megacity sprawl — horizontal arcology architecture extending to the horizon',
      spaceport: 'Aethon Orbital Ring interior — departure terminal with viewports overlooking the planet surface',
      extra:     'Aethon equatorial zone during Pale Season — dual-sun lighting casting twin shadows',
    },
  },

  // ── KALOS ──────────────────────────────────────────────────────
  kalos: {
    id:          'kalos',
    name:        'Kalos',
    type:        'Moon of Vareth',
    parentId:    'vareth',
    parentName:  'Vareth',
    tagline:     'The Industrial Heart of the Outer Belt',
    description: 'The largest and most developed moon in the Vareth system. Deep mining operations, the largest refinery complex in the mid-system, and a frontier energy that attracts workers, traders, and a certain kind of traveller who wants somewhere that still feels raw.',
    lore:        'Kalos smells of sulphur and machine oil. The air is breathable — barely — requiring filtration masks outdoors in the industrial zones, though the residential domes maintain clean air standards. What Kalos lacks in refinement it compensates for in vitality. The colony has grown faster than any settlement plan anticipated, driven by the discovery of rare-earth deposits in the deep mantle that turned out to be fifteen times richer than initial surveys suggested. The money followed the ore, and with the money came everything else: restaurants, gambling halls, a surprisingly good university, a famous mercantile exchange. Vareth hangs enormous in the sky — its storm bands shifting colours across the horizon, the permanent hyperstorm a swirling violet eye visible even in daylight.',
    atmosphere:  'Thin — filtration masks required outdoors',
    gravity:     '0.6g',
    dayLength:   '6 days (tidally locked)',
    temperature: '-80°C to 40°C (extreme diurnal swing)',
    population:  '~12 million',
    economy:     ['Deep Mining', 'Ore Refining', 'Fuel Production', 'Trade & Commerce'],
    climate:     'Extreme — thin atmosphere provides minimal thermal regulation. The day-facing side is habitable in the equatorial band; the night side is extremely cold. Most settlement is near the terminator line where conditions are most stable.',
    renderColor: '#9B7653',
    accentColor: 'rgba(155, 118, 83, 0.35)',
    spaceports: [
      { id: 'kalos_deep_port', name: 'Kalos Deep Port', type: 'surface', description: 'The main arrival and departure hub for the entire Vareth system. Heavy industrial character — freight docks dwarf the passenger terminals. The busiest port in the outer belt.' },
    ],
    routes: [
      { routeId: 'aethon_kalos',  to: 'aethon', toName: 'Aethon',  shipClass: 'Tethys',  frequency: 'Every 5 days',  scenic: false },
      { routeId: 'kalos_calyx',   to: 'calyx',  toName: 'Calyx',   shipClass: 'Tethys',  frequency: 'Every 12 days', scenic: false },
      { routeId: 'kalos_thal',    to: 'thal',   toName: 'Thal',    shipClass: 'Helion',  frequency: 'Every 3 days',  scenic: false },
      { routeId: 'kalos_mira',    to: 'mira',   toName: 'Mira',    shipClass: 'Helion',  frequency: 'Every 5 days',  scenic: false },
    ],
    facts: [
      { label: 'Parent Body',    value: 'Vareth (gas giant)' },
      { label: 'Orbital Period', value: '6 days' },
      { label: 'Orbital Radius', value: '0.008 AU from Vareth' },
      { label: 'Eccentricity',   value: '0.01' },
      { label: 'Gravity',        value: '0.6g' },
      { label: 'Spaceports',     value: '1' },
    ],
    imageSlots: {
      hero:      'Kalos surface — refinery complex silhouetted against Vareth\'s storm bands filling the sky',
      surface:   'Kalos industrial zone — ore processing machinery and pressurised worker habitats',
      spaceport: 'Kalos Deep Port — freight docks with automated ore loaders, passenger terminal beyond',
    },
  },

  // ── THAL ───────────────────────────────────────────────────────
  thal: {
    id:          'thal',
    name:        'Thal',
    type:        'Moon of Vareth',
    parentId:    'vareth',
    parentName:  'Vareth',
    tagline:     'Fire Beneath the Ice',
    description: 'A tidally heated moon kept geologically active by Vareth\'s gravitational flexing. Geothermal vent fields across the surface, harnessed for energy production. A scientific and engineering colony with a growing volcanic tourism trade.',
    lore:        'Thal\'s surface is never still. The geothermal vent fields that power most of the Vareth moon network are also the source of Thal\'s most striking feature — the light shows. When Vareth\'s magnetosphere interacts with Thal\'s volcanic emissions, the resulting aurora displays are unlike anything else in the system: curtains of green and violet light rippling across the sky above the steam vents, with Vareth\'s vast form behind them. The scientific colony here is predominantly engineers and volcanologists, but the tourism infrastructure has grown substantially as word of the aurora displays has spread. Access to the active vent zones is strictly regulated — casualties in the early settlement period were significant — but the designated viewing platforms offer unobstructed views at safe distances.',
    atmosphere:  'Thin — pressure suits required',
    gravity:     '0.5g',
    dayLength:   '11 days (tidally locked)',
    temperature: '-120°C to 800°C (vent zones)',
    population:  '~340,000',
    economy:     ['Geothermal Energy', 'Scientific Research', 'Volcanic Tourism'],
    climate:     'Extreme volcanic activity across most of the surface. Stable zones near the polar regions. Vent emissions create unpredictable atmospheric chemistry events requiring constant monitoring.',
    renderColor: '#B45309',
    accentColor: 'rgba(180, 83, 9, 0.35)',
    spaceports: [
      { id: 'thal_thermal_station', name: 'Thal Thermal Station', type: 'surface', description: 'Built on a geologically stable plateau above the vent fields. The approach corridor between two active vent ridges is considered one of the most dramatic landing sequences in the system.' },
    ],
    routes: [
      { routeId: 'aethon_thal', to: 'aethon', toName: 'Aethon', shipClass: 'Tethys', frequency: 'Every 8 days', scenic: false },
      { routeId: 'kalos_thal',  to: 'kalos',  toName: 'Kalos',  shipClass: 'Helion', frequency: 'Every 3 days', scenic: false },
      { routeId: 'thal_calyx',  to: 'calyx',  toName: 'Calyx',  shipClass: 'Tethys', frequency: 'Every 21 days', scenic: false },
    ],
    facts: [
      { label: 'Parent Body',    value: 'Vareth (gas giant)' },
      { label: 'Orbital Period', value: '11 days' },
      { label: 'Tidal Heating',  value: 'Active — maintained by Vareth resonance' },
      { label: 'Active Vents',   value: '~2,400 catalogued' },
      { label: 'Gravity',        value: '0.5g' },
      { label: 'Spaceports',     value: '1' },
    ],
    imageSlots: {
      hero:      'Thal surface — aurora display over volcanic vent field, Vareth visible through the light show',
      surface:   'Thal geothermal station — energy extraction infrastructure with glowing vents in background',
      spaceport: 'Thal Thermal Station — approach between two active ridges with steam plumes on either side',
    },
  },

  // ── MIRA ───────────────────────────────────────────────────────
  mira: {
    id:          'mira',
    name:        'Mira',
    type:        'Moon of Vareth',
    parentId:    'vareth',
    parentName:  'Vareth',
    tagline:     'The Restricted Ocean',
    description: 'An ice moon with a confirmed subsurface ocean and native microbial life. The most scientifically significant body in the system. Access is strictly controlled by interplanetary treaty — a permit is required in addition to a ticket.',
    lore:        'The discovery of microbial life in Mira\'s subsurface ocean changed the Solara system\'s understanding of itself. The organisms — simple, chemosynthetic, thriving in the mineral-rich thermal plumes beneath the ice — are not related to any life form on any other body. They evolved here. Independently. The implications are still being processed, decades later. The access restrictions exist to prevent contamination in both directions. Visitors are permitted only to the orbital station; no surface landings are allowed except for authorised research vessels operating under strict biosafety protocols. The view from the orbital station, however, is extraordinary — Mira\'s surface is cracked into immense geometric ice plates by the tidal flexing that keeps the ocean liquid below, backlit by Vareth\'s amber glow.',
    atmosphere:  'None — vacuum surface',
    gravity:     '0.3g',
    dayLength:   '19 days (tidally locked)',
    temperature: '-220°C (surface)',
    population:  '~800 (research personnel, rotating)',
    economy:     ['Scientific Research', 'Astrobiology'],
    climate:     'No atmosphere. Surface is actively reshaped by tidal flexing from Vareth-Thal resonance. The subsurface ocean maintains relatively stable thermal conditions around hydrothermal vents.',
    renderColor: '#BAE6FD',
    accentColor: 'rgba(186, 230, 253, 0.25)',
    spaceports: [
      { id: 'mira_access_point', name: 'Mira Access Point', type: 'orbital', description: 'A strictly controlled orbital station. Permits are checked before docking. No surface landings permitted for civilian vessels. The station maintains the most comprehensive biosafety quarantine protocols in the system.' },
    ],
    routes: [
      { routeId: 'aethon_mira', to: 'aethon', toName: 'Aethon', shipClass: 'Solaris', frequency: 'Every 14 days', scenic: false },
      { routeId: 'kalos_mira',  to: 'kalos',  toName: 'Kalos',  shipClass: 'Helion',  frequency: 'Every 5 days',  scenic: false },
    ],
    facts: [
      { label: 'Parent Body',    value: 'Vareth (gas giant)' },
      { label: 'Access Status',  value: 'Restricted — permit required' },
      { label: 'Orbital Period', value: '19 days' },
      { label: 'Ocean Depth',    value: 'Estimated 40–60 km' },
      { label: 'Native Life',    value: 'Confirmed microbial (chemosynthetic)' },
      { label: 'Spaceports',     value: '1 (orbital only)' },
    ],
    imageSlots: {
      hero:      'Mira from orbit — geometric ice plate fractures across the surface, Vareth in the background',
      surface:   'Mira ice surface detail — tidal fracture lines and cryovolcanic deposits',
      spaceport: 'Mira Access Point orbital station — permit checkpoint with ice moon surface below',
    },
  },

  // ── CALYX ──────────────────────────────────────────────────────
  calyx: {
    id:          'calyx',
    name:        'Calyx',
    type:        'Ice Planet',
    parentId:    null,
    parentName:  null,
    tagline:     'Beyond the Scatter',
    description: 'A small, dense ice planet in the outer system beyond the Scatter. Extraordinarily cold and mineral-rich. Colonists live almost entirely underground or in pressurised surface domes, and have developed a culture that is deeply interior-focused.',
    lore:        'Calyx is the furthest inhabited world from the binary stars, and it knows it. The light here is thin and distant — both suns are little more than bright stars in the sky, indistinguishable from each other at this range. Surface temperature on Calyx would kill an unprotected human in minutes. The colonists live underground, in the vast interconnected city networks that have been carved into the ice and rock over generations. What has emerged is a civilisation that has turned inward by necessity — art, architecture, music, and cuisine that exist entirely in enclosed spaces, optimised for beauty within walls rather than openness. The underground networks are lit by a spectrum of artificial light tuned to maintain circadian rhythms, and the city grids visible through the ice sheet at night from orbit have become an unexpected wonder of the system. Calyx is extraordinarily mineral-rich, a consequence of the Scatter\'s debris having rained down on the outer system for billions of years.',
    atmosphere:  'Thin nitrogen — fully pressurised habitats required',
    gravity:     '0.8g',
    dayLength:   '21.6 hours',
    temperature: '-190°C to -140°C (surface)',
    population:  '~1.8 million',
    economy:     ['Rare Mineral Extraction', 'Cryo-Technology Manufacturing', 'Research', 'Underground Agriculture'],
    climate:     'Permanently extreme cold. Virtually no weather events — the thin atmosphere is too cold for significant dynamics. Surface is visually featureless at distance; underground, conditions are carefully managed and stable.',
    renderColor: '#BAE6FD',
    accentColor: 'rgba(186, 230, 253, 0.2)',
    spaceports: [
      { id: 'calyx_port_north',      name: 'Calyx North Port',       type: 'surface', description: 'The primary northern hemisphere surface port. Connects to the largest underground city network.' },
      { id: 'calyx_port_equatorial', name: 'Calyx Equatorial Port',  type: 'surface', description: 'Mid-latitude surface port with the highest traffic volume on Calyx. Primary commercial hub.' },
      { id: 'calyx_port_deep',       name: 'Calyx Deep Station',     type: 'surface', description: 'A deep-ice port integrated directly into the underground city network. The most sheltered departure point in the system.' },
    ],
    routes: [
      { routeId: 'aethon_calyx',       to: 'aethon', toName: 'Aethon',  shipClass: 'Solaris', frequency: 'Every 14 days', scenic: false },
      { routeId: 'kalos_calyx',        to: 'kalos',  toName: 'Kalos',   shipClass: 'Tethys',  frequency: 'Every 12 days', scenic: false },
      { routeId: 'thal_calyx',         to: 'thal',   toName: 'Thal',    shipClass: 'Tethys',  frequency: 'Every 21 days', scenic: false },
      { routeId: 'aethon_calyx_scenic',to: 'aethon', toName: 'Aethon (Scenic)', shipClass: 'Lunara', frequency: 'Every 28 days', scenic: true },
    ],
    facts: [
      { label: 'Moons',          value: '2 (Lun, Vael)' },
      { label: 'Orbital Period', value: '2,400 days (~6.3 standard years)' },
      { label: 'Orbital Radius', value: '5.8 AU' },
      { label: 'Eccentricity',   value: '0.07' },
      { label: 'Axial Tilt',     value: '28°' },
      { label: 'Spaceports',     value: '3' },
    ],
    imageSlots: {
      hero:      'Calyx from orbit — pale blue-white sphere, underground city light grid faintly visible through surface ice',
      surface:   'Calyx underground city — vast illuminated cavern with artificial sky lighting and architectural density',
      spaceport: 'Calyx Equatorial Port — surface structure emerging from ice plain, stars and distant binary suns visible',
      extra:     'Calyx interior — the city from within, layered terraces of habitation carved into ancient ice',
    },
  },

  // ── LUN ────────────────────────────────────────────────────────
  lun: {
    id:          'lun',
    name:        'Lun',
    type:        'Moon of Calyx',
    parentId:    'calyx',
    parentName:  'Calyx',
    tagline:     'The Outer System\'s Ear',
    description: 'A dark rocky moon with subsurface liquid water pockets. Colonised primarily for its strategic orbital position — ideal for deep-outer-system observation and relay communications.',
    lore:        'Lun is a listening post as much as a settlement. Its orbital position relative to Calyx and the distant inner system makes it the best relay node in the outer belt, and the deep-space observatory here is considered the premier facility for monitoring events beyond the Scatter. The population is mixed — about half scientific and communications personnel, half a civilian community that has grown organically around the support infrastructure. Lun is quieter than anywhere else in the system. The population is small enough that most people know each other; the outdoor environment requires full pressure suits; and the view of Calyx from the surface, pale and vast, has a quality that residents describe as meditative.',
    atmosphere:  'None — full EVA required',
    gravity:     '0.15g',
    dayLength:   '9 days (tidally locked)',
    temperature: '-200°C (surface)',
    population:  '~18,000',
    economy:     ['Communications Relay', 'Deep-Space Observation', 'Research Support'],
    climate:     'No atmosphere. Very low gravity creates unusual surface dynamics. The subsurface pockets of liquid water (maintained by trace internal heating) are not accessible from the inhabited zones.',
    renderColor: '#78716C',
    accentColor: 'rgba(120, 113, 108, 0.3)',
    spaceports: [
      { id: 'lun_station', name: 'Lun Station', type: 'surface', description: 'Primary and only port on Lun. Mixed scientific and civilian use. The observation deck above the terminal offers an unobstructed view of Calyx and the outer system.' },
    ],
    routes: [
      { routeId: 'aethon_lun', to: 'aethon', toName: 'Aethon', shipClass: 'Solaris', frequency: 'Every 14 days', scenic: false },
      { routeId: 'calyx_lun',  to: 'calyx',  toName: 'Calyx',  shipClass: 'Helion',  frequency: 'Every 4 days',  scenic: false },
      { routeId: 'kalos_lun',  to: 'kalos',  toName: 'Kalos',  shipClass: 'Tethys',  frequency: 'Every 18 days', scenic: false },
    ],
    facts: [
      { label: 'Parent Body',    value: 'Calyx (ice planet)' },
      { label: 'Orbital Period', value: '9 days' },
      { label: 'Gravity',        value: '0.15g' },
      { label: 'Observatory',    value: 'Deep-Space Research Array' },
      { label: 'Subsurface',     value: 'Liquid water pockets confirmed' },
      { label: 'Spaceports',     value: '1' },
    ],
    imageSlots: {
      hero:      'Lun surface — dark rocky terrain, Calyx looming pale and enormous in the sky',
      surface:   'Lun observatory complex — antenna arrays and observation domes against a starfield',
      spaceport: 'Lun Station — compact terminal with Calyx visible through the viewport wall',
    },
  },

  // ── VAEL ───────────────────────────────────────────────────────
  vael: {
    id:          'vael',
    name:        'Vael',
    type:        'Moon of Calyx',
    parentId:    'calyx',
    parentName:  'Calyx',
    tagline:     'The Coldest Inhabited Place in the System',
    description: 'A high-albedo ice moon that reflects distant binary light more efficiently than Calyx itself. Its colony exists entirely to mine a rare mineral in its upper crust with critical applications in cryo-hibernation technology.',
    lore:        'There is an irony that has not been lost on Vael\'s colonists: they live in the harshest, most remote inhabited location in the Solara system, extracting the material that makes long-distance space travel comfortable for everyone else. Vaelisite — the mineral in question — is a naturally occurring compound found in trace amounts across the outer system, but concentrated in Vael\'s upper crust at commercially viable densities. It is a key component of the cryostasis gel used in virtually every cryo-capable ship in the fleet. The colony runs on extraction quotas, rotating shifts, and a wage premium that makes it financially attractive despite the conditions. Residents who complete a two-year rotation leave with enough savings to start elsewhere. Very few stay longer than they have to. Very few leave without respecting the place.',
    atmosphere:  'None — full EVA required',
    gravity:     '0.12g',
    dayLength:   '17 days (tidally locked)',
    temperature: '-230°C (coldest inhabited surface in the system)',
    population:  '~4,200',
    economy:     ['Vaelisite Mining', 'Cryo-Technology Supply Chain'],
    climate:     'No atmosphere. Highest albedo of any inhabited body in the system — the surface reflects so much light that external sensors require adjustment. Virtually no geological activity.',
    renderColor: '#E2E8F0',
    accentColor: 'rgba(226, 232, 240, 0.2)',
    spaceports: [
      { id: 'vael_station', name: 'Vael Station', type: 'surface', description: 'Small, functional mining colony port. The coldest staffed spaceport in the system. Arrivals are greeted with a temperature advisory and a reminder that full EVA gear is required outside pressurised areas at all times.' },
    ],
    routes: [
      { routeId: 'aethon_vael', to: 'aethon', toName: 'Aethon', shipClass: 'Solaris', frequency: 'Every 21 days', scenic: false },
      { routeId: 'calyx_vael',  to: 'calyx',  toName: 'Calyx',  shipClass: 'Helion',  frequency: 'Every 6 days',  scenic: false },
    ],
    facts: [
      { label: 'Parent Body',    value: 'Calyx (ice planet)' },
      { label: 'Orbital Period', value: '17 days' },
      { label: 'Albedo',         value: '0.94 (very high reflectivity)' },
      { label: 'Key Resource',   value: 'Vaelisite (cryo-gel component)' },
      { label: 'Temperature',    value: '-230°C — coldest inhabited surface' },
      { label: 'Spaceports',     value: '1' },
    ],
    imageSlots: {
      hero:      'Vael surface — brilliant white reflective ice plain, binary stars as two bright points in the black sky',
      surface:   'Vael mining operation — surface extraction machinery on ultra-reflective terrain',
      spaceport: 'Vael Station — functional pressurised terminal, frosted viewports, mining equipment visible outside',
    },
  },
}

export function getPlanetData(bodyId: string): BodyData | null {
  return PLANET_DATA[bodyId] ?? null
}

export function getAllPlanetIds(): string[] {
  return Object.keys(PLANET_DATA)
}

export function getAllPlanetData(): BodyData[] {
  return Object.values(PLANET_DATA)
}