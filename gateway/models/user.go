package models

import "time"

// User represents a registered passenger account.
type User struct {
	ID              string    `json:"id"`
	Email           string    `json:"email"`
	PasswordHash    string    `json:"passwordHash"`
	FirstName       string    `json:"firstName"`
	LastName        string    `json:"lastName"`
	DateOfBirth     string    `json:"dateOfBirth"`       // ISO 8601 date string "2006-01-02"
	LoyaltyPoints   int       `json:"loyaltyPoints"`
	LoyaltyTier     string    `json:"loyaltyTier"`       // ID from system.json loyaltyTiers
	FaceVectorEnrolled bool   `json:"faceVectorEnrolled"`
	FaceVector      []float64 `json:"faceVector,omitempty"` // Landmark vector — never returned in API responses
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// UserPublic is the safe public representation of a user — no password hash,
// no face vector. This is what is returned in all API responses.
type UserPublic struct {
	ID                 string    `json:"id"`
	Email              string    `json:"email"`
	FirstName          string    `json:"firstName"`
	LastName           string    `json:"lastName"`
	DateOfBirth        string    `json:"dateOfBirth"`
	LoyaltyPoints      int       `json:"loyaltyPoints"`
	LoyaltyTier        string    `json:"loyaltyTier"`
	FaceVectorEnrolled bool      `json:"faceVectorEnrolled"`
	CreatedAt          time.Time `json:"createdAt"`
}

// ToPublic converts a User to its safe public representation.
func (u *User) ToPublic() UserPublic {
	return UserPublic{
		ID:                 u.ID,
		Email:              u.Email,
		FirstName:          u.FirstName,
		LastName:           u.LastName,
		DateOfBirth:        u.DateOfBirth,
		LoyaltyPoints:      u.LoyaltyPoints,
		LoyaltyTier:        u.LoyaltyTier,
		FaceVectorEnrolled: u.FaceVectorEnrolled,
		CreatedAt:          u.CreatedAt,
	}
}