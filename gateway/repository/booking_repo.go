package repository

import (
	"fmt"

	"github.com/stellar/gateway/data"
	"github.com/stellar/gateway/models"
)

// BookingRepository handles all data access for the bookings collection.
type BookingRepository struct {
	store *data.Store
}

// NewBookingRepository creates a new BookingRepository backed by the given store.
func NewBookingRepository(store *data.Store) *BookingRepository {
	return &BookingRepository{store: store}
}

// GetAll returns all bookings.
func (r *BookingRepository) GetAll() ([]models.Booking, error) {
	return data.ReadAll[models.Booking](r.store.BookingsPath)
}

// GetByID returns the booking with the given ID.
func (r *BookingRepository) GetByID(id string) (*models.Booking, error) {
	bookings, err := data.ReadAll[models.Booking](r.store.BookingsPath)
	if err != nil {
		return nil, err
	}
	for i := range bookings {
		if bookings[i].ID == id {
			return &bookings[i], nil
		}
	}
	return nil, fmt.Errorf("booking %q not found", id)
}

// GetByUserID returns all bookings belonging to a given user.
func (r *BookingRepository) GetByUserID(userID string) ([]models.Booking, error) {
	bookings, err := data.ReadAll[models.Booking](r.store.BookingsPath)
	if err != nil {
		return nil, err
	}
	var result []models.Booking
	for _, b := range bookings {
		if b.UserID == userID {
			result = append(result, b)
		}
	}
	return result, nil
}

// GetByGroupID returns all legs of a multi-stop journey sharing the given group ID.
func (r *BookingRepository) GetByGroupID(groupID string) ([]models.Booking, error) {
	bookings, err := data.ReadAll[models.Booking](r.store.BookingsPath)
	if err != nil {
		return nil, err
	}
	var result []models.Booking
	for _, b := range bookings {
		if b.GroupID == groupID {
			result = append(result, b)
		}
	}
	return result, nil
}

// Create appends a new booking to the store.
func (r *BookingRepository) Create(booking models.Booking) error {
	bookings, err := data.ReadAll[models.Booking](r.store.BookingsPath)
	if err != nil {
		return err
	}
	bookings = append(bookings, booking)
	return data.WriteAll(r.store.BookingsPath, bookings)
}

// Update replaces an existing booking record matched by ID.
func (r *BookingRepository) Update(updated models.Booking) error {
	bookings, err := data.ReadAll[models.Booking](r.store.BookingsPath)
	if err != nil {
		return err
	}
	for i := range bookings {
		if bookings[i].ID == updated.ID {
			bookings[i] = updated
			return data.WriteAll(r.store.BookingsPath, bookings)
		}
	}
	return fmt.Errorf("booking %q not found", updated.ID)
}

// Cancel sets a booking's status to cancelled.
func (r *BookingRepository) Cancel(id string) error {
	bookings, err := data.ReadAll[models.Booking](r.store.BookingsPath)
	if err != nil {
		return err
	}
	for i := range bookings {
		if bookings[i].ID == id {
			bookings[i].Status = models.BookingStatusCancelled
			return data.WriteAll(r.store.BookingsPath, bookings)
		}
	}
	return fmt.Errorf("booking %q not found", id)
}