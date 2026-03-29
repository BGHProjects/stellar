package handlers

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/stellar/gateway/services"
)

// ScheduleHandler handles rolling departure schedule endpoints.
type ScheduleHandler struct {
	voyageService *services.VoyageService
}

// NewScheduleHandler creates a new ScheduleHandler.
func NewScheduleHandler(voyageService *services.VoyageService) *ScheduleHandler {
	return &ScheduleHandler{voyageService: voyageService}
}

// GetSchedule godoc
//
//	@Summary		Get the rolling departure schedule for a route
//	@Description	Returns the next N scheduled departures for a given route, starting from a specified date. Each entry includes orbital-window-adjusted duration, pricing, and window rating. The schedule is deterministic — the same date always produces the same departures.
//	@Tags			schedule
//	@Produce		json
//	@Param			routeId		path	string	true	"Route ID (e.g. 'aethon_kalos')"
//	@Param			fromDate	query	string	false	"Start date (ISO 8601). Defaults to today."
//	@Param			count		query	int		false	"Number of departures to return (default 10, max 50)"
//	@Success		200			{array}		models.ScheduleEntry
//	@Failure		400			{object}	map[string]string
//	@Failure		404			{object}	map[string]string	"Route not found"
//	@Router			/schedule/{routeId} [get]
func (h *ScheduleHandler) GetSchedule(w http.ResponseWriter, r *http.Request) {
	routeID := chi.URLParam(r, "routeId")
	q := r.URL.Query()

	count, _ := strconv.Atoi(q.Get("count"))
	if count <= 0 {
		count = 10
	}
	if count > 50 {
		count = 50
	}

	fromDay, err := h.voyageService.CurrentDayOrParam(q.Get("fromDate"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid fromDate: "+err.Error())
		return
	}

	entries, err := h.voyageService.GetSchedule(routeID, fromDay, count)
	if err != nil {
		if err.Error() == "route \""+routeID+"\" not found" {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respond(w, http.StatusOK, entries)
}