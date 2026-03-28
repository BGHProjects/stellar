package models

import "time"

// Voyage is a calculated, non-stored type representing a specific scheduled
// departure on a route. It is derived at request time from system.json config
// and the orbital simulation — it is never written to the data store.
//
// A Voyage is what appears in search results and voyage detail pages.
type Voyage struct {
	ID                  string    `json:"id"`           // Deterministic: routeId + departureDay
	RouteID             string    `json:"routeId"`
	RouteTypeID         string    `json:"routeTypeId"`
	ShipClassID         string    `json:"shipClassId"`
	OriginID            string    `json:"originId"`
	DestinationID       string    `json:"destinationId"`
	AvailableRouteTypes []string  `json:"availableRouteTypes"`
	DepartureDay        float64   `json:"departureDay"`
	ArrivalDay          float64   `json:"arrivalDay"`
	DepartureDate       time.Time `json:"departureDate"`
	ArrivalDate         time.Time `json:"arrivalDate"`
	DurationDays        float64   `json:"durationDays"`
	DistanceAU          float64   `json:"distanceAU"`
	OrbitalWindowRating int       `json:"orbitalWindowRating"` // 1–5
	CrossesScatter      bool      `json:"crossesScatter"`
	PermitRequired      bool      `json:"permitRequired"`

	// Pricing — base fares before cabin/cryo selection.
	// Full price is calculated in the booking flow once cabin and cryo are chosen.
	LowestAvailablePrice float64 `json:"lowestAvailablePrice"`
	BasePriceCredits     float64 `json:"basePriceCredits"`
	PriceMultiplier      float64 `json:"priceMultiplier"` // Orbital window multiplier applied

	// Availability — simplified for JSON store; in a real system this would
	// track per-cabin-class remaining berths.
	TotalCapacity     int `json:"totalCapacity"`
	AvailableBerths   int `json:"availableBerths"`
}

// VoyageSearchParams are the query parameters for the voyage search endpoint.
type VoyageSearchParams struct {
	OriginID      string `json:"originId"`
	DestinationID string `json:"destinationId"`
	DepartureDate string `json:"departureDate"` // ISO 8601 date string
	Adults        int    `json:"adults"`
	Children      int    `json:"children"`
	RouteTypeID   string `json:"routeTypeId,omitempty"` // Optional filter
}

// ScheduleEntry represents a single departure in the rolling schedule
// for a specific route.
type ScheduleEntry struct {
	RouteID       string    `json:"routeId"`
	DepartureDay  float64   `json:"departureDay"`
	DepartureDate time.Time `json:"departureDate"`
	ArrivalDay    float64   `json:"arrivalDay"`
	ArrivalDate   time.Time `json:"arrivalDate"`
	DurationDays  float64   `json:"durationDays"`
	OrbitalWindowRating int `json:"orbitalWindowRating"`
	BasePriceCredits float64 `json:"basePriceCredits"`
}