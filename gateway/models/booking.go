package models

import "time"

// BookingStatus represents the lifecycle state of a booking.
type BookingStatus string

const (
	BookingStatusConfirmed  BookingStatus = "confirmed"
	BookingStatusCancelled  BookingStatus = "cancelled"
	BookingStatusCompleted  BookingStatus = "completed"
	BookingStatusBondHeld   BookingStatus = "bond_held" // Voyage Bond deposit paid, remainder pending
)

// Booking represents a confirmed voyage booking.
// A booking belongs to one user and contains one or more passengers.
// Multi-leg bookings are represented as separate linked bookings sharing a GroupID.
type Booking struct {
	ID             string        `json:"id"`
	UserID         string        `json:"userId"`
	GroupID        string        `json:"groupId"`        // Links legs of a multi-stop journey; equals ID for single-leg
	LegNumber      int           `json:"legNumber"`      // 1 for single-leg or first leg; 2, 3 for subsequent legs
	RouteID        string        `json:"routeId"`        // From system.json routes
	RouteTypeID    string        `json:"routeTypeId"`    // From system.json routeTypes
	ShipClassID    string        `json:"shipClassId"`    // From system.json shipClasses
	DepartureDay   float64       `json:"departureDay"`   // Simulation day number
	ArrivalDay     float64       `json:"arrivalDay"`     // Simulation day number
	DepartureDate  time.Time     `json:"departureDate"`  // Calendar date (derived from departureDay)
	ArrivalDate    time.Time     `json:"arrivalDate"`    // Calendar date (derived from arrivalDay)
	OriginID       string        `json:"originId"`       // Body ID from system.json
	DestinationID  string        `json:"destinationId"`  // Body ID from system.json
	DeparturPortID string        `json:"departurePortId"` // Spaceport ID from system.json
	ArrivalPortID  string        `json:"arrivalPortId"`   // Spaceport ID from system.json
	CryoOptionID   string        `json:"cryoOptionId"`   // From system.json cryoOptions
	CabinClassID   string        `json:"cabinClassId"`   // From system.json cabinClasses
	Passengers     []Passenger   `json:"passengers"`
	AddOns         []BookedAddOn `json:"addOns"`
	PriceBreakdown PriceBreakdown `json:"priceBreakdown"`
	TotalPrice     float64       `json:"totalPrice"`
	LoyaltyPointsApplied int     `json:"loyaltyPointsApplied"`
	LoyaltyPointsEarned  int     `json:"loyaltyPointsEarned"`
	IsVoyageBond   bool          `json:"isVoyageBond"`
	DepositPaid    float64       `json:"depositPaid"`
	BalanceDue     float64       `json:"balanceDue"`
	Status         BookingStatus `json:"status"`
	OrbitalWindowRating int      `json:"orbitalWindowRating"` // 1–5 at time of booking
	PermitRequired bool          `json:"permitRequired"`
	CreatedAt      time.Time     `json:"createdAt"`
	UpdatedAt      time.Time     `json:"updatedAt"`
}

// PriceBreakdown itemises the components of the total fare.
type PriceBreakdown struct {
	BaseFare              float64 `json:"baseFare"`
	RouteTypeAdjustment   float64 `json:"routeTypeAdjustment"`
	CabinClassAdjustment  float64 `json:"cabinClassAdjustment"`
	CryoAdjustment        float64 `json:"cryoAdjustment"`
	OrbitalWindowAdjustment float64 `json:"orbitalWindowAdjustment"`
	AddOnsTotal           float64 `json:"addOnsTotal"`
	ChildDiscounts        float64 `json:"childDiscounts"`
	LoyaltyDiscount       float64 `json:"loyaltyDiscount"`
	PortFees              float64 `json:"portFees"`
	Total                 float64 `json:"total"`
}

// BookedAddOn records a selected add-on against a booking.
type BookedAddOn struct {
	AddOnID    string  `json:"addOnId"`
	Category   string  `json:"category"` // "journeyProtection" | "dining" | "recreation" | "entertainment" | "expeditionExtras"
	Quantity   int     `json:"quantity"` // For per-night/per-session/per-unit add-ons
	UnitPrice  float64 `json:"unitPrice"`
	TotalPrice float64 `json:"totalPrice"`
}

// Passenger represents an individual traveller within a booking.
type Passenger struct {
	ID             string `json:"id"`
	BookingID      string `json:"bookingId"`
	FirstName      string `json:"firstName"`
	LastName       string `json:"lastName"`
	DateOfBirth    string `json:"dateOfBirth"` // ISO 8601
	IsChild        bool   `json:"isChild"`
	CabinBerth     string `json:"cabinBerth,omitempty"` // Selected berth/cabin identifier on the ship
	CryoIntervals  int    `json:"cryoIntervals,omitempty"` // Number of intervals for cryo_intervals option
	SpecialRequests string `json:"specialRequests,omitempty"`
}