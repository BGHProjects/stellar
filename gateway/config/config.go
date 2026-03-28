// Package config loads all application configuration from environment variables
// and the canonical system.json config file. All other packages receive their
// configuration through this package — no package reads env vars or files directly.
package config

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// -----------------------------------------------------------------
// Top-level app config (from environment variables)
// -----------------------------------------------------------------

// AppConfig holds all runtime configuration derived from environment variables.
type AppConfig struct {
	Port                  string
	Env                   string
	JWTSecret             string
	JWTAccessExpiryHours  int
	JWTRefreshExpiryDays  int
	SystemConfigPath      string
	DataPath              string
	AIServiceURL          string
	VisionServiceURL      string
	RoutingServiceURL     string
	AllowedOrigins        []string
}

// Load reads environment variables and returns a populated AppConfig.
// Returns an error if any required variable is missing or invalid.
func Load() (*AppConfig, error) {
	jwtAccessHours, err := strconv.Atoi(getEnv("JWT_ACCESS_EXPIRY_HOURS", "24"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_ACCESS_EXPIRY_HOURS: %w", err)
	}

	jwtRefreshDays, err := strconv.Atoi(getEnv("JWT_REFRESH_EXPIRY_DAYS", "30"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_REFRESH_EXPIRY_DAYS: %w", err)
	}

	jwtSecret := getEnv("JWT_SECRET", "")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	originsRaw := getEnv("ALLOWED_ORIGINS", "http://localhost:5173")
	origins := strings.Split(originsRaw, ",")
	for i, o := range origins {
		origins[i] = strings.TrimSpace(o)
	}

	return &AppConfig{
		Port:                 getEnv("PORT", "8080"),
		Env:                  getEnv("ENV", "development"),
		JWTSecret:            jwtSecret,
		JWTAccessExpiryHours: jwtAccessHours,
		JWTRefreshExpiryDays: jwtRefreshDays,
		SystemConfigPath:     getEnv("SYSTEM_CONFIG_PATH", "../config/system.json"),
		DataPath:             getEnv("DATA_PATH", "./data"),
		AIServiceURL:         getEnv("AI_SERVICE_URL", ""),
		VisionServiceURL:     getEnv("VISION_SERVICE_URL", ""),
		RoutingServiceURL:    getEnv("ROUTING_SERVICE_URL", ""),
		AllowedOrigins:       origins,
	}, nil
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}

// -----------------------------------------------------------------
// System config (from system.json)
// -----------------------------------------------------------------

// SystemConfig is the root of the canonical system.json configuration.
// All orbital mechanics, ship classes, routes, and pricing derive from this struct.
// It is loaded once at startup and treated as read-only throughout the application.
type SystemConfig struct {
	Epoch           EpochConfig          `json:"epoch"`
	Simulation      SimulationConfig     `json:"simulation"`
	Stars           []StarConfig         `json:"stars"`
	LagrangeStations []LagrangeConfig    `json:"lagrangeStations"`
	Bodies          []BodyConfig         `json:"bodies"`
	Spaceports      []SpaceportConfig    `json:"spaceports"`
	ShipClasses     []ShipClassConfig    `json:"shipClasses"`
	CabinClasses    []CabinClassConfig   `json:"cabinClasses"`
	CryoOptions     []CryoOptionConfig   `json:"cryoOptions"`
	RouteTypes      []RouteTypeConfig    `json:"routeTypes"`
	Routes          []RouteConfig        `json:"routes"`
	Pricing         PricingConfig        `json:"pricing"`
	OrbitalWindow   OrbitalWindowConfig  `json:"orbitalWindowRating"`
	AddOns          AddOnsConfig         `json:"addOns"`
	LoyaltyTiers    []LoyaltyTierConfig  `json:"loyaltyTiers"`
	Mock            MockConfig           `json:"mock"`
}

type EpochConfig struct {
	Date      string `json:"date"`
	DayNumber int    `json:"dayNumber"`
}

type SimulationConfig struct {
	AUToKM                  float64 `json:"auToKm"`
	DefaultTimeStepDays     float64 `json:"defaultTimeStepDays"`
	OrbitRefinementPasses   int     `json:"orbitRefinementPasses"`
	ScatterInnerRadiusAU    float64 `json:"scatterInnerRadiusAU"`
	ScatterOuterRadiusAU    float64 `json:"scatterOuterRadiusAU"`
}

type StarConfig struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	Type          string  `json:"type"`
	Description   string  `json:"description"`
	OrbitalRadius float64 `json:"orbitalRadius"`
	Period        float64 `json:"period"`
	StartPhase    float64 `json:"startPhase"`
	RenderColor   string  `json:"renderColor"`
	RenderRadius  float64 `json:"renderRadius"`
}

type LagrangeConfig struct {
	ID                  string   `json:"id"`
	Name                string   `json:"name"`
	Description         string   `json:"description"`
	LagrangePoint       string   `json:"lagrangePoint"`
	ReferenceBody       string   `json:"referenceBody"`
	AngularOffsetDegrees float64 `json:"angularOffsetDegrees"`
	Visitable           bool     `json:"visitable"`
	Spaceports          []string `json:"spaceports"`
	RenderColor         string   `json:"renderColor"`
	RenderRadius        float64  `json:"renderRadius"`
}

type BodyConfig struct {
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	Type           string   `json:"type"`
	Parent         string   `json:"parent"`
	Description    string   `json:"description"`
	OrbitalRadius  float64  `json:"orbitalRadius"`
	Period         float64  `json:"period"`
	Eccentricity   float64  `json:"eccentricity"`
	AxialTilt      float64  `json:"axialTilt"`
	RotationPeriod float64  `json:"rotationPeriod"`
	StartPhase     float64  `json:"startPhase"`
	Visitable      bool     `json:"visitable"`
	VisitRestricted bool    `json:"visitRestricted"`
	PermitRequired bool     `json:"visitPermitRequired"`
	Spaceports     []string `json:"spaceports"`
	Moons          []string `json:"moons"`
	RenderColor    string   `json:"renderColor"`
	RenderRadius   float64  `json:"renderRadius"`
	RenderFeatures []string `json:"renderFeatures"`
}

type SpaceportConfig struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Body        string `json:"body"`
	Type        string `json:"type"`
	Description string `json:"description"`
}

type ShipClassConfig struct {
	ID                   string   `json:"id"`
	Name                 string   `json:"name"`
	Description          string   `json:"description"`
	SpeedAUPerDay        float64  `json:"speedAUPerDay"`
	MaxPassengers        int      `json:"maxPassengers"`
	HasCryo              bool     `json:"hasCryo"`
	CryoOptions          []string `json:"cryoOptions"`
	CabinClasses         []string `json:"cabinClasses"`
	AvailableRouteTypes  []string `json:"availableRouteTypes"`
	SpacewalkCapable     bool     `json:"spacewalkCapable"`
	RenderScale          float64  `json:"renderScale"`
}

type CabinClassConfig struct {
	ID                    string   `json:"id"`
	Name                  string   `json:"name"`
	Description           string   `json:"description"`
	PriceMultiplier       float64  `json:"priceMultiplier"`
	PrivateCabin          bool     `json:"privatecabin"`
	ViewportAccess        string   `json:"viewportAccess"`
	DiningTier            string   `json:"diningTier"`
	CompatibleCryoOptions []string `json:"compatibleCryoOptions"`
}

type CryoOptionConfig struct {
	ID                   string  `json:"id"`
	Name                 string  `json:"name"`
	Description          string  `json:"description"`
	PriceMultiplier      float64 `json:"priceMultiplier"`
	AmenitiesEnabled     bool    `json:"amenitiesEnabled"`
	MinIntervalsPerDays  float64 `json:"minIntervalsPerDays"`
	MaxIntervalsPerDays  float64 `json:"maxIntervalsPerDays"`
	AbsoluteMinIntervals int     `json:"absoluteMinIntervals"`
	AbsoluteMaxIntervals int     `json:"absoluteMaxIntervals"`
}

type RouteTypeConfig struct {
	ID                string  `json:"id"`
	Name              string  `json:"name"`
	Description       string  `json:"description"`
	SpeedMultiplier   float64 `json:"speedMultiplier"`
	PriceMultiplier   float64 `json:"priceMultiplier"`
	CrossesScatterRisk string `json:"crossesScatterRisk"`
}

type RouteConfig struct {
	ID                   string   `json:"id"`
	Origin               string   `json:"origin"`
	Destination          string   `json:"destination"`
	ShipClass            string   `json:"shipClass"`
	FrequencyDays        int      `json:"frequencyDays"`
	CrossesScatter       bool     `json:"crossesScatter"`
	AvailableRouteTypes  []string `json:"availableRouteTypes"`
	BasePriceCredits     float64  `json:"basePriceCredits"`
	PermitRequired       bool     `json:"permitRequired"`
	DestinationLandable  bool     `json:"destinationLandable"`
	Notes                string   `json:"notes"`
}

type PricingConfig struct {
	Currency                  string                  `json:"currency"`
	CurrencySymbol            string                  `json:"currencySymbol"`
	ChildAgeMax               int                     `json:"childAgeMax"`
	ChildDiscountMultiplier   float64                 `json:"childDiscountMultiplier"`
	OrbitalWindow             OrbitalWindowPricing    `json:"orbitalWindow"`
	VoyageBondDepositFraction float64                 `json:"voyageBondDepositFraction"`
	LoyaltyPointsPerCredit    float64                 `json:"loyaltyPointsPerCredit"`
	LoyaltyPointRedemptionRate float64                `json:"loyaltyPointRedemptionRate"`
}

type OrbitalWindowPricing struct {
	Rating5 float64 `json:"rating5"`
	Rating4 float64 `json:"rating4"`
	Rating3 float64 `json:"rating3"`
	Rating2 float64 `json:"rating2"`
	Rating1 float64 `json:"rating1"`
}

type OrbitalWindowConfig struct {
	Thresholds OrbitalWindowThresholds `json:"thresholds"`
}

type OrbitalWindowThresholds struct {
	Rating5 float64 `json:"rating5"`
	Rating4 float64 `json:"rating4"`
	Rating3 float64 `json:"rating3"`
	Rating2 float64 `json:"rating2"`
	Rating1 float64 `json:"rating1"`
}

type AddOnsConfig struct {
	JourneyProtection []AddOnItem `json:"journeyProtection"`
	Dining            []AddOnItem `json:"dining"`
	Recreation        []AddOnItem `json:"recreation"`
	Entertainment     []AddOnItem `json:"entertainment"`
	ExpeditionExtras  []AddOnItem `json:"expeditionExtras"`
}

type AddOnItem struct {
	ID                   string   `json:"id"`
	Name                 string   `json:"name"`
	Description          string   `json:"description"`
	PriceCredits         float64  `json:"priceCredits"`
	PriceCreditsPerNight float64  `json:"priceCreditsPerNight"`
	PriceCreditsPerSession float64 `json:"priceCreditsPerSession"`
	PriceCreditsPerMeal  float64  `json:"priceCreditsPerMeal"`
	PriceCreditsPerUnit  float64  `json:"priceCreditsPerUnit"`
	PriceCreditsPerEvent float64  `json:"priceCreditsPerEvent"`
	AvailableToAllCryo   bool     `json:"availableToAllCryo"`
	AvailableToCryo      []string `json:"availableToCryo"`
	AvailableCabins      []string `json:"availableCabins"`
	ShipClassRequired    []string `json:"shipClassRequired"`
	SegmentRestricted    bool     `json:"segmentRestricted"`
	VoyageSpecific       bool     `json:"voyageSpecific"`
	DestinationSpecific  bool     `json:"destinationSpecific"`
	RelevantIfCrossesScatter bool `json:"relevantIfCrossesScatter"`
}

type LoyaltyTierConfig struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	MinPoints int      `json:"minPoints"`
	MaxPoints *int     `json:"maxPoints"`
	Benefits  []string `json:"benefits"`
}

type MockConfig struct {
	Enabled          bool     `json:"enabled"`
	FixtureDataPath  string   `json:"fixtureDataPath"`
	DisabledFeatures []string `json:"disabledFeatures"`
	DegradedFeatures []string `json:"degradedFeatures"`
}

// LoadSystemConfig reads and parses the system.json file at the given path.
func LoadSystemConfig(path string) (*SystemConfig, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("opening system config at %q: %w", path, err)
	}
	defer f.Close()

	var cfg SystemConfig
	if err := json.NewDecoder(f).Decode(&cfg); err != nil {
		return nil, fmt.Errorf("parsing system config: %w", err)
	}
	return &cfg, nil
}

// -----------------------------------------------------------------
// Convenience lookups — O(n) over config slices, called at startup
// to build maps used throughout the application lifetime.
// -----------------------------------------------------------------

// BuildBodyMap returns a map of body ID -> BodyConfig for fast lookup.
func BuildBodyMap(cfg *SystemConfig) map[string]BodyConfig {
	m := make(map[string]BodyConfig, len(cfg.Bodies))
	for _, b := range cfg.Bodies {
		m[b.ID] = b
	}
	return m
}

// BuildRouteMap returns a map of route ID -> RouteConfig for fast lookup.
func BuildRouteMap(cfg *SystemConfig) map[string]RouteConfig {
	m := make(map[string]RouteConfig, len(cfg.Routes))
	for _, r := range cfg.Routes {
		m[r.ID] = r
	}
	return m
}

// BuildShipClassMap returns a map of ship class ID -> ShipClassConfig.
func BuildShipClassMap(cfg *SystemConfig) map[string]ShipClassConfig {
	m := make(map[string]ShipClassConfig, len(cfg.ShipClasses))
	for _, s := range cfg.ShipClasses {
		m[s.ID] = s
	}
	return m
}

// BuildRouteTypeMap returns a map of route type ID -> RouteTypeConfig.
func BuildRouteTypeMap(cfg *SystemConfig) map[string]RouteTypeConfig {
	m := make(map[string]RouteTypeConfig, len(cfg.RouteTypes))
	for _, rt := range cfg.RouteTypes {
		m[rt.ID] = rt
	}
	return m
}

// BuildCabinClassMap returns a map of cabin class ID -> CabinClassConfig.
func BuildCabinClassMap(cfg *SystemConfig) map[string]CabinClassConfig {
	m := make(map[string]CabinClassConfig, len(cfg.CabinClasses))
	for _, c := range cfg.CabinClasses {
		m[c.ID] = c
	}
	return m
}

// BuildCryoOptionMap returns a map of cryo option ID -> CryoOptionConfig.
func BuildCryoOptionMap(cfg *SystemConfig) map[string]CryoOptionConfig {
	m := make(map[string]CryoOptionConfig, len(cfg.CryoOptions))
	for _, c := range cfg.CryoOptions {
		m[c.ID] = c
	}
	return m
}