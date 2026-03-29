package handlers

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/stellar/gateway/models"
	"github.com/stellar/gateway/services"
)

// VoyageHandler handles voyage search and detail endpoints.
type VoyageHandler struct {
	voyageService *services.VoyageService
}

// NewVoyageHandler creates a new VoyageHandler.
func NewVoyageHandler(voyageService *services.VoyageService) *VoyageHandler {
	return &VoyageHandler{voyageService: voyageService}
}

// Search godoc
//
//	@Summary		Search for available voyages
//	@Description	Returns available voyages matching the given origin, destination, departure date, and passenger count. Each result includes orbital-window-adjusted duration and pricing. Supports optional route type filtering.
//	@Tags			voyages
//	@Produce		json
//	@Param			originId		query	string	true	"Origin body ID (e.g. 'aethon')"
//	@Param			destinationId	query	string	true	"Destination body ID (e.g. 'kalos')"
//	@Param			departureDate	query	string	false	"ISO 8601 date (e.g. '2801-03-15'). Defaults to today."
//	@Param			adults			query	int		false	"Number of adult passengers (default 1)"
//	@Param			children		query	int		false	"Number of child passengers (default 0)"
//	@Param			routeTypeId		query	string	false	"Filter by route type ID (e.g. 'direct', 'scenic')"
//	@Success		200				{array}		models.Voyage
//	@Failure		400				{object}	map[string]string
//	@Router			/voyages/search [get]
func (h *VoyageHandler) Search(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	adults, _ := strconv.Atoi(q.Get("adults"))
	if adults <= 0 {
		adults = 1
	}
	children, _ := strconv.Atoi(q.Get("children"))

	params := models.VoyageSearchParams{
		OriginID:      q.Get("originId"),
		DestinationID: q.Get("destinationId"),
		DepartureDate: q.Get("departureDate"),
		Adults:        adults,
		Children:      children,
		RouteTypeID:   q.Get("routeTypeId"),
	}

	if params.OriginID == "" || params.DestinationID == "" {
		respondError(w, http.StatusBadRequest, "originId and destinationId are required")
		return
	}

	voyages, err := h.voyageService.SearchVoyages(params)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respond(w, http.StatusOK, voyages)
}

// GetVoyage godoc
//
//	@Summary		Get a single voyage by ID
//	@Description	Returns full details for a specific voyage, identified by its deterministic ID (routeId:departureDay). Includes orbital window rating, route visualiser data, and available add-ons.
//	@Tags			voyages
//	@Produce		json
//	@Param			id	path		string	true	"Voyage ID (format: routeId:departureDay)"
//	@Success		200	{object}	models.Voyage
//	@Failure		400	{object}	map[string]string
//	@Failure		404	{object}	map[string]string
//	@Router			/voyages/{id} [get]
func (h *VoyageHandler) GetVoyage(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		respondError(w, http.StatusBadRequest, "voyage ID is required")
		return
	}

	voyage, err := h.voyageService.GetVoyage(id)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	respond(w, http.StatusOK, voyage)
}

// CalculatePrice godoc
//
//	@Summary		Calculate full price for a voyage configuration
//	@Description	Returns a complete itemised price breakdown for the given voyage, cabin class, cryo option, add-ons, and passenger count. Call this whenever the user changes a selection in the booking flow to keep pricing live.
//	@Tags			voyages
//	@Accept			json
//	@Produce		json
//	@Param			body	body		priceRequest	true	"Price calculation inputs"
//	@Success		200		{object}	models.PriceBreakdown
//	@Failure		400		{object}	map[string]string
//	@Router			/voyages/price [post]
func (h *VoyageHandler) CalculatePrice(w http.ResponseWriter, r *http.Request) {
	var req priceRequest
	if !decode(w, r, &req) {
		return
	}

	breakdown, err := h.voyageService.CalculatePrice(
		req.RouteID,
		req.RouteTypeID,
		req.CabinClassID,
		req.CryoOptionID,
		req.DepartureDay,
		req.Adults,
		req.Children,
		req.AddOnIDs,
		req.LoyaltyPointsToRedeem,
	)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respond(w, http.StatusOK, breakdown)
}

// GetOrbitalPositions godoc
//
//	@Summary		Get current orbital positions of all bodies
//	@Description	Returns the 2D orbital plane positions of all system bodies at a given simulation day. Used by the frontend renderer and the chatbot's orbital calculation tool.
//	@Tags			voyages
//	@Produce		json
//	@Param			day	query	number	false	"Simulation day number. Defaults to today."
//	@Success		200	{object}	map[string]orbitalPositionResponse
//	@Failure		400	{object}	map[string]string
//	@Router			/voyages/orbital-positions [get]
func (h *VoyageHandler) GetOrbitalPositions(w http.ResponseWriter, r *http.Request) {
	day, err := h.voyageService.CurrentDayOrParam(r.URL.Query().Get("day"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid day parameter: "+err.Error())
		return
	}

	positions := h.voyageService.AllBodyPositions(day)
	respond(w, http.StatusOK, positions)
}

// GetClosestApproach godoc
//
//	@Summary		Find the closest approach window between two bodies
//	@Description	Searches for the day within the next N days when two bodies are at their closest orbital separation. Used by the chatbot and the star map explore mode.
//	@Tags			voyages
//	@Produce		json
//	@Param			originId		query	string	true	"Origin body ID"
//	@Param			destinationId	query	string	true	"Destination body ID"
//	@Param			fromDate		query	string	false	"Start of search window (ISO 8601). Defaults to today."
//	@Param			windowDays		query	int		false	"Number of days to search ahead (default 365)"
//	@Success		200	{object}	closestApproachResponse
//	@Failure		400	{object}	map[string]string
//	@Router			/voyages/closest-approach [get]
func (h *VoyageHandler) GetClosestApproach(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	originID := q.Get("originId")
	destID := q.Get("destinationId")
	if originID == "" || destID == "" {
		respondError(w, http.StatusBadRequest, "originId and destinationId are required")
		return
	}

	windowDays, _ := strconv.Atoi(q.Get("windowDays"))
	if windowDays <= 0 {
		windowDays = 365
	}

	result, err := h.voyageService.GetClosestApproach(originID, destID, q.Get("fromDate"), windowDays)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respond(w, http.StatusOK, result)
}

// -----------------------------------------------------------------
// Request / response types local to this handler
// -----------------------------------------------------------------

type priceRequest struct {
	RouteID               string   `json:"routeId"`
	RouteTypeID           string   `json:"routeTypeId"`
	CabinClassID          string   `json:"cabinClassId"`
	CryoOptionID          string   `json:"cryoOptionId"`
	DepartureDay          float64  `json:"departureDay"`
	Adults                int      `json:"adults"`
	Children              int      `json:"children"`
	AddOnIDs              []string `json:"addOnIds"`
	LoyaltyPointsToRedeem int      `json:"loyaltyPointsToRedeem"`
}

type orbitalPositionResponse struct {
	BodyID string  `json:"bodyId"`
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	Day    float64 `json:"day"`
}

type closestApproachResponse struct {
	OriginID      string  `json:"originId"`
	DestinationID string  `json:"destinationId"`
	Day           float64 `json:"day"`
	Date          string  `json:"date"`
	DistanceAU    float64 `json:"distanceAU"`
	WindowRating  int     `json:"windowRating"`
}