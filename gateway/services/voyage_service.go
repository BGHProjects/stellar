package services

import (
	"fmt"
	"math"
	"strconv"
	"time"

	"github.com/stellar/gateway/config"
	"github.com/stellar/gateway/models"
	"github.com/stellar/gateway/orbital"
)

// VoyageService handles voyage search, schedule generation, and pricing calculations.
// All logic derives from system.json config — no values are hardcoded.
type VoyageService struct {
	sysCfg      *config.SystemConfig
	bodyMap     map[string]config.BodyConfig
	routeMap    map[string]config.RouteConfig
	shipMap     map[string]config.ShipClassConfig
	routeTypeMap map[string]config.RouteTypeConfig
	cabinMap    map[string]config.CabinClassConfig
	cryoMap     map[string]config.CryoOptionConfig
}

// NewVoyageService creates a new VoyageService with pre-built lookup maps.
func NewVoyageService(sysCfg *config.SystemConfig) *VoyageService {
	return &VoyageService{
		sysCfg:       sysCfg,
		bodyMap:      config.BuildBodyMap(sysCfg),
		routeMap:     config.BuildRouteMap(sysCfg),
		shipMap:      config.BuildShipClassMap(sysCfg),
		routeTypeMap: config.BuildRouteTypeMap(sysCfg),
		cabinMap:     config.BuildCabinClassMap(sysCfg),
		cryoMap:      config.BuildCryoOptionMap(sysCfg),
	}
}

// -----------------------------------------------------------------
// Voyage search
// -----------------------------------------------------------------

// SearchVoyages returns all available voyages matching the given search parameters.
// It queries all routes matching origin/destination, generates the next several
// departures for each, and calculates orbital-influenced duration and pricing.
func (s *VoyageService) SearchVoyages(params models.VoyageSearchParams) ([]models.Voyage, error) {
	departureDay, err := s.dayFromDateStr(params.DepartureDate)
	if err != nil {
		return nil, fmt.Errorf("invalid departure date: %w", err)
	}

	var voyages []models.Voyage

	for _, route := range s.sysCfg.Routes {
		if !s.routeMatchesSearch(route, params) {
			continue
		}

		// Generate the next 3 departures on or after the requested date
		departures := s.nextDepartures(route, departureDay, 3)
		for _, depDay := range departures {
			voyage, err := s.buildVoyage(route, depDay, params.RouteTypeID)
			if err != nil {
				continue // Skip routes with config errors rather than failing the whole search
			}
			voyages = append(voyages, voyage)
		}
	}

	return voyages, nil
}

// GetVoyage returns a single voyage by its deterministic ID (routeId:departureDay).
func (s *VoyageService) GetVoyage(voyageID string) (*models.Voyage, error) {
	routeID, departureDay, err := parseVoyageID(voyageID)
	if err != nil {
		return nil, err
	}

	route, ok := s.routeMap[routeID]
	if !ok {
		return nil, fmt.Errorf("route %q not found", routeID)
	}

	voyage, err := s.buildVoyage(route, departureDay, "")
	if err != nil {
		return nil, err
	}
	return &voyage, nil
}

// -----------------------------------------------------------------
// Schedule generation
// -----------------------------------------------------------------

// GetSchedule returns the rolling departure schedule for a route,
// starting from a given simulation day, for the requested number of entries.
func (s *VoyageService) GetSchedule(routeID string, fromDay float64, count int) ([]models.ScheduleEntry, error) {
	route, ok := s.routeMap[routeID]
	if !ok {
		return nil, fmt.Errorf("route %q not found", routeID)
	}

	ship, ok := s.shipMap[route.ShipClass]
	if !ok {
		return nil, fmt.Errorf("ship class %q not found", route.ShipClass)
	}

	originParams, err := s.bodyParams(route.Origin)
	if err != nil {
		return nil, err
	}
	destParams, err := s.bodyParams(route.Destination)
	if err != nil {
		return nil, err
	}

	departures := s.nextDepartures(route, fromDay, count)
	entries := make([]models.ScheduleEntry, 0, len(departures))

	for _, depDay := range departures {
		duration := orbital.VoyageDuration(
			originParams, destParams, depDay,
			ship.SpeedAUPerDay,
			s.sysCfg.Simulation.OrbitRefinementPasses,
		)
		arrivalDay := depDay + duration
		windowRating := orbital.WindowRating(
			originParams, destParams, depDay,
			s.sysCfg.OrbitalWindow.Thresholds,
		)
		price := s.basePrice(route, windowRating)

		depDate, _ := orbital.DateFromDay(s.sysCfg.Epoch.Date, depDay)
		arrDate, _ := orbital.DateFromDay(s.sysCfg.Epoch.Date, arrivalDay)

		entries = append(entries, models.ScheduleEntry{
			RouteID:             routeID,
			DepartureDay:        depDay,
			DepartureDate:       depDate,
			ArrivalDay:          arrivalDay,
			ArrivalDate:         arrDate,
			DurationDays:        math.Round(duration*10) / 10,
			OrbitalWindowRating: windowRating,
			BasePriceCredits:    price,
		})
	}

	return entries, nil
}

// -----------------------------------------------------------------
// Pricing
// -----------------------------------------------------------------

// CalculatePrice computes the full price for a booking given all selections.
// This is the single source of pricing truth — all price components derive
// from config multipliers applied in sequence.
func (s *VoyageService) CalculatePrice(
	routeID string,
	routeTypeID string,
	cabinClassID string,
	cryoOptionID string,
	departureDay float64,
	adults int,
	children int,
	addOnIDs []string,
	loyaltyPointsToRedeem int,
) (*models.PriceBreakdown, error) {
	route, ok := s.routeMap[routeID]
	if !ok {
		return nil, fmt.Errorf("route %q not found", routeID)
	}

	routeType, ok := s.routeTypeMap[routeTypeID]
	if !ok {
		return nil, fmt.Errorf("route type %q not found", routeTypeID)
	}

	cabin, ok := s.cabinMap[cabinClassID]
	if !ok {
		return nil, fmt.Errorf("cabin class %q not found", cabinClassID)
	}

	cryo, ok := s.cryoMap[cryoOptionID]
	if !ok {
		return nil, fmt.Errorf("cryo option %q not found", cryoOptionID)
	}

	originParams, err := s.bodyParams(route.Origin)
	if err != nil {
		return nil, err
	}
	destParams, err := s.bodyParams(route.Destination)
	if err != nil {
		return nil, err
	}

	windowRating := orbital.WindowRating(
		originParams, destParams, departureDay,
		s.sysCfg.OrbitalWindow.Thresholds,
	)
	windowMultiplier := s.windowMultiplier(windowRating)

	baseFare := route.BasePriceCredits
	routeAdj := baseFare * (routeType.PriceMultiplier - 1.0)
	cabinAdj := baseFare * (cabin.PriceMultiplier - 1.0)
	cryoAdj := baseFare * (cryo.PriceMultiplier - 1.0)
	windowAdj := baseFare * (windowMultiplier - 1.0)

	perPassengerBase := baseFare + routeAdj + cabinAdj + cryoAdj + windowAdj
	adultTotal := perPassengerBase * float64(adults)
	childTotal := perPassengerBase * s.sysCfg.Pricing.ChildDiscountMultiplier * float64(children)
	childDiscountSaving := (perPassengerBase * float64(children)) - childTotal

	addOnsTotal := s.calculateAddOns(addOnIDs)

	portFees := route.BasePriceCredits * 0.05 // 5% of base as port/docking levy

	loyaltyDiscount := float64(loyaltyPointsToRedeem) * s.sysCfg.Pricing.LoyaltyPointRedemptionRate

	total := adultTotal + childTotal + addOnsTotal + portFees - loyaltyDiscount
	if total < 0 {
		total = 0
	}

	return &models.PriceBreakdown{
		BaseFare:                baseFare * float64(adults+children),
		RouteTypeAdjustment:     routeAdj * float64(adults+children),
		CabinClassAdjustment:    cabinAdj * float64(adults+children),
		CryoAdjustment:          cryoAdj * float64(adults+children),
		OrbitalWindowAdjustment: windowAdj * float64(adults+children),
		AddOnsTotal:             addOnsTotal,
		ChildDiscounts:          -childDiscountSaving,
		LoyaltyDiscount:         -loyaltyDiscount,
		PortFees:                portFees,
		Total:                   math.Round(total*100) / 100,
	}, nil
}

// -----------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------

func (s *VoyageService) routeMatchesSearch(route config.RouteConfig, params models.VoyageSearchParams) bool {
	if route.Origin != params.OriginID && route.Destination != params.OriginID {
		return false
	}
	if route.Origin != params.DestinationID && route.Destination != params.DestinationID {
		return false
	}
	if params.RouteTypeID != "" {
		found := false
		for _, rt := range route.AvailableRouteTypes {
			if rt == params.RouteTypeID {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	return true
}

// nextDepartures generates the next n departure day numbers on or after fromDay,
// based on the route's frequency. The schedule is deterministic — departures are
// calculated from epoch day 0 using the route frequency, so the same date always
// produces the same departure regardless of when the query is made.
func (s *VoyageService) nextDepartures(route config.RouteConfig, fromDay float64, n int) []float64 {
	freq := float64(route.FrequencyDays)
	// Find the first departure on or after fromDay
	firstIndex := math.Ceil(fromDay / freq)
	departures := make([]float64, n)
	for i := 0; i < n; i++ {
		departures[i] = (firstIndex + float64(i)) * freq
	}
	return departures
}

func (s *VoyageService) buildVoyage(route config.RouteConfig, departureDay float64, routeTypeID string) (models.Voyage, error) {
	ship, ok := s.shipMap[route.ShipClass]
	if !ok {
		return models.Voyage{}, fmt.Errorf("ship class %q not found", route.ShipClass)
	}

	originParams, err := s.bodyParams(route.Origin)
	if err != nil {
		return models.Voyage{}, err
	}
	destParams, err := s.bodyParams(route.Destination)
	if err != nil {
		return models.Voyage{}, err
	}

	// Use the requested route type's speed multiplier if provided, else default (direct)
	effectiveSpeed := ship.SpeedAUPerDay
	if routeTypeID != "" {
		if rt, ok := s.routeTypeMap[routeTypeID]; ok {
			effectiveSpeed = ship.SpeedAUPerDay * rt.SpeedMultiplier
		}
	}

	duration := orbital.VoyageDuration(
		originParams, destParams, departureDay,
		effectiveSpeed,
		s.sysCfg.Simulation.OrbitRefinementPasses,
	)
	arrivalDay := departureDay + duration

	distAU := orbital.Distance(originParams, destParams, departureDay)

	windowRating := orbital.WindowRating(
		originParams, destParams, departureDay,
		s.sysCfg.OrbitalWindow.Thresholds,
	)

	price := s.basePrice(route, windowRating)

	depDate, _ := orbital.DateFromDay(s.sysCfg.Epoch.Date, departureDay)
	arrDate, _ := orbital.DateFromDay(s.sysCfg.Epoch.Date, arrivalDay)

	effectiveRouteTypeID := routeTypeID
	if effectiveRouteTypeID == "" && len(route.AvailableRouteTypes) > 0 {
		effectiveRouteTypeID = route.AvailableRouteTypes[0]
	}

	return models.Voyage{
		ID:                  fmt.Sprintf("%s:%g", route.ID, departureDay),
		RouteID:             route.ID,
		RouteTypeID:         effectiveRouteTypeID,
		ShipClassID:         route.ShipClass,
		OriginID:            route.Origin,
		DestinationID:       route.Destination,
		AvailableRouteTypes: route.AvailableRouteTypes,
		DepartureDay:        departureDay,
		ArrivalDay:          arrivalDay,
		DepartureDate:       depDate,
		ArrivalDate:         arrDate,
		DurationDays:        math.Round(duration*10) / 10,
		DistanceAU:          math.Round(distAU*100) / 100,
		OrbitalWindowRating: windowRating,
		CrossesScatter:      route.CrossesScatter,
		PermitRequired:      route.PermitRequired,
		BasePriceCredits:    route.BasePriceCredits,
		LowestAvailablePrice: price,
		PriceMultiplier:     s.windowMultiplier(windowRating),
		TotalCapacity:       ship.MaxPassengers,
		AvailableBerths:     ship.MaxPassengers, // Simplified — no live inventory
	}, nil
}

func (s *VoyageService) bodyParams(bodyID string) (orbital.OrbitalParams, error) {
	body, ok := s.bodyMap[bodyID]
	if !ok {
		return orbital.OrbitalParams{}, fmt.Errorf("body %q not found in system config", bodyID)
	}
	return orbital.ParamsFromBody(body), nil
}

func (s *VoyageService) basePrice(route config.RouteConfig, windowRating int) float64 {
	return math.Round(route.BasePriceCredits*s.windowMultiplier(windowRating)*100) / 100
}

func (s *VoyageService) windowMultiplier(rating int) float64 {
	p := s.sysCfg.Pricing.OrbitalWindow
	switch rating {
	case 5:
		return p.Rating5
	case 4:
		return p.Rating4
	case 3:
		return p.Rating3
	case 2:
		return p.Rating2
	default:
		return p.Rating1
	}
}

func (s *VoyageService) calculateAddOns(addOnIDs []string) float64 {
	// Build a flat lookup of all add-ons by ID
	allAddOns := make(map[string]config.AddOnItem)
	for _, a := range s.sysCfg.AddOns.JourneyProtection {
		allAddOns[a.ID] = a
	}
	for _, a := range s.sysCfg.AddOns.Dining {
		allAddOns[a.ID] = a
	}
	for _, a := range s.sysCfg.AddOns.Recreation {
		allAddOns[a.ID] = a
	}
	for _, a := range s.sysCfg.AddOns.Entertainment {
		allAddOns[a.ID] = a
	}
	for _, a := range s.sysCfg.AddOns.ExpeditionExtras {
		allAddOns[a.ID] = a
	}

	total := 0.0
	for _, id := range addOnIDs {
		if a, ok := allAddOns[id]; ok {
			// Use whichever price field is set — flat price takes precedence
			if a.PriceCredits > 0 {
				total += a.PriceCredits
			} else if a.PriceCreditsPerSession > 0 {
				total += a.PriceCreditsPerSession
			} else if a.PriceCreditsPerNight > 0 {
				total += a.PriceCreditsPerNight
			}
		}
	}
	return total
}

func (s *VoyageService) dayFromDateStr(dateStr string) (float64, error) {
	if dateStr == "" {
		return orbital.Today(s.sysCfg.Epoch.Date)
	}
	t, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return 0, err
	}
	return orbital.DayFromDate(s.sysCfg.Epoch.Date, t)
}

// CurrentDayOrParam returns today's simulation day, or parses a provided
// day string. Accepts either a float (simulation day) or an ISO date string.
func (s *VoyageService) CurrentDayOrParam(param string) (float64, error) {
	if param == "" {
		return orbital.Today(s.sysCfg.Epoch.Date)
	}
	// Try parsing as a float first (simulation day number)
	if day, err := strconv.ParseFloat(param, 64); err == nil {
		return day, nil
	}
	// Fall back to date string
	t, err := time.Parse("2006-01-02", param)
	if err != nil {
		return 0, err
	}
	return orbital.DayFromDate(s.sysCfg.Epoch.Date, t)
}

// AllBodyPositions returns the 2D orbital positions of all bodies at the given day.
func (s *VoyageService) AllBodyPositions(day float64) map[string][2]float64 {
	positions := make(map[string][2]float64, len(s.sysCfg.Bodies))
	for _, body := range s.sysCfg.Bodies {
		params := orbital.ParamsFromBody(body)
		// For moons, add the parent body's position
		if body.Parent != "" {
			if parent, ok := s.bodyMap[body.Parent]; ok {
				parentParams := orbital.ParamsFromBody(parent)
				mx, my := orbital.MoonPosition(params, parentParams, day)
				positions[body.ID] = [2]float64{mx, my}
				continue
			}
		}
		positions[body.ID] = orbital.PositionVec2(params, day)
	}
	return positions
}

// GetClosestApproach finds the closest approach between two bodies within a search window.
func (s *VoyageService) GetClosestApproach(originID, destID, fromDateStr string, windowDays int) (map[string]interface{}, error) {
	fromDay, err := s.dayFromDateStr(fromDateStr)
	if err != nil {
		return nil, err
	}

	originParams, err := s.bodyParams(originID)
	if err != nil {
		return nil, err
	}
	destParams, err := s.bodyParams(destID)
	if err != nil {
		return nil, err
	}

	day, distAU := orbital.ClosestApproach(originParams, destParams, fromDay, windowDays)
	rating := orbital.WindowRating(originParams, destParams, day, s.sysCfg.OrbitalWindow.Thresholds)
	date, _ := orbital.DateFromDay(s.sysCfg.Epoch.Date, day)

	return map[string]interface{}{
		"originId":      originID,
		"destinationId": destID,
		"day":           day,
		"date":          date.Format("2006-01-02"),
		"distanceAU":    math.Round(distAU*100) / 100,
		"windowRating":  rating,
	}, nil
}

// parseVoyageID splits a voyage ID of the form "routeId:departureDay".
func parseVoyageID(id string) (routeID string, departureDay float64, err error) {
	var day float64
	n, parseErr := fmt.Sscanf(id, "%s:%g", &routeID, &day)
	if parseErr != nil || n != 2 {
		return "", 0, fmt.Errorf("invalid voyage ID format %q (expected routeId:departureDay)", id)
	}
	return routeID, day, nil
}