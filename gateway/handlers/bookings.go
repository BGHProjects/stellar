package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/stellar/gateway/models"
	"github.com/stellar/gateway/services"
)

// BookingHandler handles booking creation, retrieval, and cancellation.
type BookingHandler struct {
	bookingService *services.BookingService
}

// NewBookingHandler creates a new BookingHandler.
func NewBookingHandler(bookingService *services.BookingService) *BookingHandler {
	return &BookingHandler{bookingService: bookingService}
}

// CreateBooking godoc
//
//	@Summary		Create a new booking
//	@Description	Creates a confirmed booking for one or more passengers on a specified voyage. Handles multi-leg journeys via the groupId field. Awards loyalty points on completion. Returns the full booking record including price breakdown and boarding pass data.
//	@Tags			bookings
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		services.CreateBookingRequest	true	"Booking creation payload"
//	@Success		201		{object}	models.Booking
//	@Failure		400		{object}	map[string]string
//	@Failure		401		{object}	map[string]string
//	@Failure		422		{object}	map[string]string	"Validation error (e.g. insufficient loyalty points)"
//	@Router			/bookings [post]
func (h *BookingHandler) CreateBooking(w http.ResponseWriter, r *http.Request) {
	userID := middleware_userID(r)

	var req services.CreateBookingRequest
	if !decode(w, r, &req) {
		return
	}

	// Enforce that the booking belongs to the authenticated user
	req.UserID = userID

	booking, err := h.bookingService.CreateBooking(req)
	if err != nil {
		respondError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	respond(w, http.StatusCreated, booking)
}

// GetBooking godoc
//
//	@Summary		Get a booking by ID
//	@Description	Returns the full booking record for the given booking ID. Only accessible by the booking's owner.
//	@Tags			bookings
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		string	true	"Booking ID"
//	@Success		200	{object}	models.Booking
//	@Failure		401	{object}	map[string]string
//	@Failure		404	{object}	map[string]string
//	@Router			/bookings/{id} [get]
func (h *BookingHandler) GetBooking(w http.ResponseWriter, r *http.Request) {
	userID := middleware_userID(r)
	bookingID := chi.URLParam(r, "id")

	booking, err := h.bookingService.GetBooking(bookingID, userID)
	if err != nil {
		respondError(w, http.StatusNotFound, "booking not found")
		return
	}

	respond(w, http.StatusOK, booking)
}

// GetUserBookings godoc
//
//	@Summary		Get all bookings for the authenticated user
//	@Description	Returns all bookings belonging to the currently authenticated user, including upcoming, completed, and cancelled voyages.
//	@Tags			bookings
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{array}		models.Booking
//	@Failure		401	{object}	map[string]string
//	@Router			/bookings/me [get]
func (h *BookingHandler) GetUserBookings(w http.ResponseWriter, r *http.Request) {
	userID := middleware_userID(r)

	bookings, err := h.bookingService.GetUserBookings(userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to retrieve bookings")
		return
	}

	// Return empty array rather than null when there are no bookings
	if bookings == nil {
		bookings = []models.Booking{}
	}

	respond(w, http.StatusOK, bookings)
}

// CancelBooking godoc
//
//	@Summary		Cancel a booking
//	@Description	Cancels a confirmed booking. Only the booking owner can cancel. Already-cancelled bookings return a 422.
//	@Tags			bookings
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		string	true	"Booking ID"
//	@Success		200	{object}	map[string]string
//	@Failure		401	{object}	map[string]string
//	@Failure		404	{object}	map[string]string
//	@Failure		422	{object}	map[string]string	"Booking already cancelled"
//	@Router			/bookings/{id}/cancel [patch]
func (h *BookingHandler) CancelBooking(w http.ResponseWriter, r *http.Request) {
	userID := middleware_userID(r)
	bookingID := chi.URLParam(r, "id")

	if err := h.bookingService.CancelBooking(bookingID, userID); err != nil {
		if err.Error() == "booking is already cancelled" {
			respondError(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		respondError(w, http.StatusNotFound, "booking not found")
		return
	}

	respond(w, http.StatusOK, map[string]string{"message": "booking cancelled successfully"})
}