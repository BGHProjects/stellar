// Package repository provides typed data access operations for each collection.
// Each repository reads from and writes to its backing JSON file via the data
// store abstraction. No business logic lives here — only data access.
package repository

import (
	"fmt"

	"github.com/stellar/gateway/data"
	"github.com/stellar/gateway/models"
)

// UserRepository handles all data access for the users collection.
type UserRepository struct {
	store *data.Store
}

// NewUserRepository creates a new UserRepository backed by the given store.
func NewUserRepository(store *data.Store) *UserRepository {
	return &UserRepository{store: store}
}

// GetAll returns all users.
func (r *UserRepository) GetAll() ([]models.User, error) {
	return data.ReadAll[models.User](r.store.UsersPath)
}

// GetByID returns the user with the given ID, or an error if not found.
func (r *UserRepository) GetByID(id string) (*models.User, error) {
	users, err := data.ReadAll[models.User](r.store.UsersPath)
	if err != nil {
		return nil, err
	}
	for i := range users {
		if users[i].ID == id {
			return &users[i], nil
		}
	}
	return nil, fmt.Errorf("user %q not found", id)
}

// GetByEmail returns the user with the given email address, or an error if not found.
func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	users, err := data.ReadAll[models.User](r.store.UsersPath)
	if err != nil {
		return nil, err
	}
	for i := range users {
		if users[i].Email == email {
			return &users[i], nil
		}
	}
	return nil, fmt.Errorf("user with email %q not found", email)
}

// Create appends a new user to the store.
// Returns an error if a user with the same email already exists.
func (r *UserRepository) Create(user models.User) error {
	users, err := data.ReadAll[models.User](r.store.UsersPath)
	if err != nil {
		return err
	}
	for _, u := range users {
		if u.Email == user.Email {
			return fmt.Errorf("user with email %q already exists", user.Email)
		}
	}
	users = append(users, user)
	return data.WriteAll(r.store.UsersPath, users)
}

// Update replaces an existing user record (matched by ID) with the provided value.
// Returns an error if no user with that ID exists.
func (r *UserRepository) Update(updated models.User) error {
	users, err := data.ReadAll[models.User](r.store.UsersPath)
	if err != nil {
		return err
	}
	for i := range users {
		if users[i].ID == updated.ID {
			users[i] = updated
			return data.WriteAll(r.store.UsersPath, users)
		}
	}
	return fmt.Errorf("user %q not found", updated.ID)
}

// EmailExists returns true if any user has the given email address.
func (r *UserRepository) EmailExists(email string) (bool, error) {
	_, err := r.GetByEmail(email)
	if err != nil {
		return false, nil // Not found is not an error here
	}
	return true, nil
}