package services

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/stellar/gateway/config"
	"github.com/stellar/gateway/models"
	"github.com/stellar/gateway/orbital"
	"github.com/stellar/gateway/repository"
)

// BookingService handles booking creation, retrieval, and cancellation.
type BookingService struct {
	bookingRepo  *repository.BookingRepository
	userRepo     *repository.UserRepository
	voyageService *VoyageService
	sysCfg       *config.SystemConfig
}

// NewBookingService creates a new BookingService.
func NewBookingService(
	bookingRepo *repository.BookingRepository,
	userRepo *repository.UserRepository,
	voyageService *VoyageService,
	sysCfg *config.SystemConfig,
) *BookingService {
	return &BookingService{
		bookingRepo:   bookingRepo,
		userRepo:      userRepo,
		voyageService: voyageService,
		sysCfg:        sysCfg,
	}
}

// CreateBookingRequest is the payload for creating a new booking.
type CreateBookingRequest struct {
	UserID                string                `json:"userId"`
	GroupID               string                `json:"groupId,omitempty"` // Set by client for multi-leg journeys
	LegNumber             int                   `json:"legNumber"`
	RouteID               string                `json:"routeId"`
	RouteTypeID           string                `json:"routeTypeId"`
	DepartureDay          float64               `json:"departureDay"`
	DeparturePortID       string                `json:"departurePortId"`
	ArrivalPortID         string                `json:"arrivalPortId"`
	CryoOptionID          string                `json:"cryoOptionId"`
	CabinClassID          string                `json:"cabinClassId"`
	Passengers            []PassengerRequest    `json:"passengers"`
	AddOnIDs              []string              `json:"addOnIds"`
	LoyaltyPointsToRedeem int                   `json:"loyaltyPointsToRedeem"`
	IsVoyageBond          bool                  `json:"isVoyageBond"`
}

// PassengerRequest holds the details for a single passenger in a booking request.
type PassengerRequest struct {
	FirstName       string `json:"firstName"`
	LastName        string `json:"lastName"`
	DateOfBirth     string `json:"dateOfBirth"`
	CabinBerth      string `json:"cabinBerth,omitempty"`
	CryoIntervals   int    `json:"cryoIntervals,omitempty"`
	SpecialRequests string `json:"specialRequests,omitempty"`
}

// CreateBooking validates and creates a new booking, awards loyalty points,
// and returns the completed booking record.
func (s *BookingService) CreateBooking(req CreateBookingRequest) (*models.Booking, error) {
	if err := s.validateCreateRequest(req); err != nil {
		return nil, err
	}

	route, ok := s.voyageService.routeMap[req.RouteID]
	if !ok {
		return nil, fmt.Errorf("route %q not found", req.RouteID)
	}

	// Fetch the user to validate loyalty points
	user, err := s.userRepo.GetByID(req.UserID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	if req.LoyaltyPointsToRedeem > user.LoyaltyPoints {
		return nil, fmt.Errorf("insufficient loyalty points: have %d, requested %d",
			user.LoyaltyPoints, req.LoyaltyPointsToRedeem)
	}

	adults, children := countPassengers(req.Passengers, s.sysCfg.Pricing.ChildAgeMax)

	priceBreakdown, err := s.voyageService.CalculatePrice(
		req.RouteID,
		req.RouteTypeID,
		req.CabinClassID,
		req.CryoOptionID,
		req.DepartureDay,
		adults,
		children,
		req.AddOnIDs,
		req.LoyaltyPointsToRedeem,
	)
	if err != nil {
		return nil, fmt.Errorf("calculating price: %w", err)
	}

	originParams, _ := s.voyageService.bodyParams(route.Origin)
	destParams, _ := s.voyageService.bodyParams(route.Destination)
	ship := s.voyageService.shipMap[route.ShipClass]
	routeType := s.voyageService.routeTypeMap[req.RouteTypeID]

	duration := orbital.VoyageDuration(
		originParams, destParams, req.DepartureDay,
		ship.SpeedAUPerDay*routeType.SpeedMultiplier,
		s.sysCfg.Simulation.OrbitRefinementPasses,
	)
	arrivalDay := req.DepartureDay + duration

	windowRating := orbital.WindowRating(
		originParams, destParams, req.DepartureDay,
		s.sysCfg.OrbitalWindow.Thresholds,
	)

	depDate, _ := orbital.DateFromDay(s.sysCfg.Epoch.Date, req.DepartureDay)
	arrDate, _ := orbital.DateFromDay(s.sysCfg.Epoch.Date, arrivalDay)

	passengers := buildPassengers(req.Passengers, s.sysCfg.Pricing.ChildAgeMax)
	addOns := buildBookedAddOns(req.AddOnIDs, s.sysCfg)

	pointsEarned := int(priceBreakdown.Total * s.sysCfg.Pricing.LoyaltyPointsPerCredit)

	groupID := req.GroupID
	if groupID == "" {
		groupID = uuid.NewString()
	}
	legNumber := req.LegNumber
	if legNumber == 0 {
		legNumber = 1
	}

	depositPaid := 0.0
	balanceDue := priceBreakdown.Total
	if req.IsVoyageBond {
		depositPaid = priceBreakdown.Total * s.sysCfg.Pricing.VoyageBondDepositFraction
		balanceDue = priceBreakdown.Total - depositPaid
	}

	now := time.Now().UTC()
	booking := models.Booking{
		ID:              uuid.NewString(),
		UserID:          req.UserID,
		GroupID:         groupID,
		LegNumber:       legNumber,
		RouteID:         req.RouteID,
		RouteTypeID:     req.RouteTypeID,
		ShipClassID:     route.ShipClass,
		DepartureDay:    req.DepartureDay,
		ArrivalDay:      arrivalDay,
		DepartureDate:   depDate,
		ArrivalDate:     arrDate,
		OriginID:        route.Origin,
		DestinationID:   route.Destination,
		DeparturPortID:  req.DeparturePortID,
		ArrivalPortID:   req.ArrivalPortID,
		CryoOptionID:    req.CryoOptionID,
		CabinClassID:    req.CabinClassID,
		Passengers:      passengers,
		AddOns:          addOns,
		PriceBreakdown:  *priceBreakdown,
		TotalPrice:      priceBreakdown.Total,
		LoyaltyPointsApplied: req.LoyaltyPointsToRedeem,
		LoyaltyPointsEarned:  pointsEarned,
		IsVoyageBond:    req.IsVoyageBond,
		DepositPaid:     depositPaid,
		BalanceDue:      balanceDue,
		Status:          models.BookingStatusConfirmed,
		OrbitalWindowRating: windowRating,
		PermitRequired:  route.PermitRequired,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	if req.IsVoyageBond {
		booking.Status = models.BookingStatusBondHeld
	}

	if err := s.bookingRepo.Create(booking); err != nil {
		return nil, err
	}

	// Update user loyalty points
	user.LoyaltyPoints = user.LoyaltyPoints - req.LoyaltyPointsToRedeem + pointsEarned
	user.LoyaltyTier = s.calculateTier(user.LoyaltyPoints)
	user.UpdatedAt = now
	if err := s.userRepo.Update(*user); err != nil {
		// Non-fatal — booking is confirmed, log and continue
		_ = err
	}

	return &booking, nil
}

// GetBooking returns a single booking by ID, verifying it belongs to the requesting user.
func (s *BookingService) GetBooking(bookingID, userID string) (*models.Booking, error) {
	booking, err := s.bookingRepo.GetByID(bookingID)
	if err != nil {
		return nil, err
	}
	if booking.UserID != userID {
		return nil, fmt.Errorf("booking %q not found", bookingID)
	}
	return booking, nil
}

// GetUserBookings returns all bookings for the given user.
func (s *BookingService) GetUserBookings(userID string) ([]models.Booking, error) {
	return s.bookingRepo.GetByUserID(userID)
}

// CancelBooking cancels a booking, verifying ownership.
func (s *BookingService) CancelBooking(bookingID, userID string) error {
	booking, err := s.bookingRepo.GetByID(bookingID)
	if err != nil {
		return err
	}
	if booking.UserID != userID {
		return fmt.Errorf("booking %q not found", bookingID)
	}
	if booking.Status == models.BookingStatusCancelled {
		return fmt.Errorf("booking is already cancelled")
	}
	return s.bookingRepo.Cancel(bookingID)
}

// -----------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------

func (s *BookingService) validateCreateRequest(req CreateBookingRequest) error {
	if req.UserID == "" {
		return fmt.Errorf("userId is required")
	}
	if req.RouteID == "" {
		return fmt.Errorf("routeId is required")
	}
	if req.RouteTypeID == "" {
		return fmt.Errorf("routeTypeId is required")
	}
	if req.CabinClassID == "" {
		return fmt.Errorf("cabinClassId is required")
	}
	if req.CryoOptionID == "" {
		return fmt.Errorf("cryoOptionId is required")
	}
	if len(req.Passengers) == 0 {
		return fmt.Errorf("at least one passenger is required")
	}
	return nil
}

func (s *BookingService) calculateTier(points int) string {
	for i := len(s.sysCfg.LoyaltyTiers) - 1; i >= 0; i-- {
		tier := s.sysCfg.LoyaltyTiers[i]
		if points >= tier.MinPoints {
			return tier.ID
		}
	}
	return s.sysCfg.LoyaltyTiers[0].ID
}

func countPassengers(passengers []PassengerRequest, childAgeMax int) (adults, children int) {
	for _, p := range passengers {
		if isChild(p.DateOfBirth, childAgeMax) {
			children++
		} else {
			adults++
		}
	}
	return adults, children
}

func isChild(dateOfBirth string, childAgeMax int) bool {
	dob, err := time.Parse("2006-01-02", dateOfBirth)
	if err != nil {
		return false
	}
	age := int(time.Since(dob).Hours() / 24 / 365.25)
	return age <= childAgeMax
}

func buildPassengers(reqs []PassengerRequest, childAgeMax int) []models.Passenger {
	passengers := make([]models.Passenger, len(reqs))
	for i, req := range reqs {
		passengers[i] = models.Passenger{
			ID:              uuid.NewString(),
			FirstName:       req.FirstName,
			LastName:        req.LastName,
			DateOfBirth:     req.DateOfBirth,
			IsChild:         isChild(req.DateOfBirth, childAgeMax),
			CabinBerth:      req.CabinBerth,
			CryoIntervals:   req.CryoIntervals,
			SpecialRequests: req.SpecialRequests,
		}
	}
	return passengers
}

func buildBookedAddOns(addOnIDs []string, sysCfg *config.SystemConfig) []models.BookedAddOn {
	allAddOns := make(map[string]struct {
		item     config.AddOnItem
		category string
	})
	for _, a := range sysCfg.AddOns.JourneyProtection {
		allAddOns[a.ID] = struct {
			item     config.AddOnItem
			category string
		}{a, "journeyProtection"}
	}
	for _, a := range sysCfg.AddOns.Dining {
		allAddOns[a.ID] = struct {
			item     config.AddOnItem
			category string
		}{a, "dining"}
	}
	for _, a := range sysCfg.AddOns.Recreation {
		allAddOns[a.ID] = struct {
			item     config.AddOnItem
			category string
		}{a, "recreation"}
	}
	for _, a := range sysCfg.AddOns.Entertainment {
		allAddOns[a.ID] = struct {
			item     config.AddOnItem
			category string
		}{a, "entertainment"}
	}
	for _, a := range sysCfg.AddOns.ExpeditionExtras {
		allAddOns[a.ID] = struct {
			item     config.AddOnItem
			category string
		}{a, "expeditionExtras"}
	}

	result := make([]models.BookedAddOn, 0, len(addOnIDs))
	for _, id := range addOnIDs {
		if entry, ok := allAddOns[id]; ok {
			price := entry.item.PriceCredits
			if price == 0 {
				price = entry.item.PriceCreditsPerSession
			}
			result = append(result, models.BookedAddOn{
				AddOnID:    id,
				Category:   entry.category,
				Quantity:   1,
				UnitPrice:  price,
				TotalPrice: price,
			})
		}
	}
	return result
}