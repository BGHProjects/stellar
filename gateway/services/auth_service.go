package services

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stellar/gateway/config"
	"github.com/stellar/gateway/models"
	"github.com/stellar/gateway/repository"
	"golang.org/x/crypto/bcrypt"
)

// AuthService handles user registration, login, and JWT management.
type AuthService struct {
	userRepo  *repository.UserRepository
	appConfig *config.AppConfig
}

// NewAuthService creates a new AuthService.
func NewAuthService(userRepo *repository.UserRepository, appConfig *config.AppConfig) *AuthService {
	return &AuthService{userRepo: userRepo, appConfig: appConfig}
}

// RegisterRequest is the payload for a new user registration.
type RegisterRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	DateOfBirth string `json:"dateOfBirth"`
}

// LoginRequest is the payload for a login attempt.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse is returned on successful register or login.
type AuthResponse struct {
	AccessToken  string           `json:"accessToken"`
	RefreshToken string           `json:"refreshToken"`
	User         models.UserPublic `json:"user"`
}

// jwtClaims holds the data encoded in a JWT.
type jwtClaims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// Register creates a new user account and returns auth tokens.
func (s *AuthService) Register(req RegisterRequest) (*AuthResponse, error) {
	if req.Email == "" || req.Password == "" || req.FirstName == "" || req.LastName == "" {
		return nil, fmt.Errorf("email, password, firstName, and lastName are required")
	}

	exists, err := s.userRepo.EmailExists(req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("an account with that email address already exists")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hashing password: %w", err)
	}

	now := time.Now().UTC()
	user := models.User{
		ID:           uuid.NewString(),
		Email:        req.Email,
		PasswordHash: string(hash),
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		DateOfBirth:  req.DateOfBirth,
		LoyaltyPoints: 0,
		LoyaltyTier:  "drifter",
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	return s.buildAuthResponse(user)
}

// Login validates credentials and returns auth tokens.
func (s *AuthService) Login(req LoginRequest) (*AuthResponse, error) {
	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		// Return a generic error — don't reveal whether the email exists
		return nil, fmt.Errorf("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	return s.buildAuthResponse(*user)
}

// FaceLoginRequest is the payload for a face-authenticated login.
// The vision service must have already verified the face before this is called.
type FaceLoginRequest struct {
	Email string `json:"email"`
}

// FaceLogin issues auth tokens for a user identified by face authentication.
// No password check — the caller is responsible for having verified the face
// via the vision service before calling this.
func (s *AuthService) FaceLogin(req FaceLoginRequest) (*AuthResponse, error) {
	if req.Email == "" {
		return nil, fmt.Errorf("email is required")
	}

	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		return nil, fmt.Errorf("no account found for that email address")
	}

	if !user.FaceVectorEnrolled {
		return nil, fmt.Errorf("face ID is not enrolled for this account")
	}

	return s.buildAuthResponse(*user)
}

// ValidateAccessToken parses and validates a JWT access token.
// Returns the user ID and email encoded in the token, or an error.
func (s *AuthService) ValidateAccessToken(tokenString string) (userID, email string, err error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwtClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(s.appConfig.JWTSecret), nil
	})
	if err != nil {
		return "", "", fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(*jwtClaims)
	if !ok || !token.Valid {
		return "", "", fmt.Errorf("invalid token claims")
	}

	return claims.UserID, claims.Email, nil
}

// RefreshTokens issues a new access/refresh token pair given a valid refresh token.
func (s *AuthService) RefreshTokens(refreshTokenString string) (*AuthResponse, error) {
	userID, _, err := s.ValidateAccessToken(refreshTokenString)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}

	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return s.buildAuthResponse(*user)
}

// buildAuthResponse generates access and refresh tokens for the given user.
func (s *AuthService) buildAuthResponse(user models.User) (*AuthResponse, error) {
	accessToken, err := s.issueToken(user, time.Duration(s.appConfig.JWTAccessExpiryHours)*time.Hour)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.issueToken(user, time.Duration(s.appConfig.JWTRefreshExpiryDays)*24*time.Hour)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user.ToPublic(),
	}, nil
}

// GetUserByID returns the full user record for the given ID.
func (s *AuthService) GetUserByID(id string) (*models.User, error) {
	return s.userRepo.GetByID(id)
}

// UpdateFaceVector stores the facial landmark vector for the given user.
// Only the numeric vector is stored — no image data is ever accepted or retained.
func (s *AuthService) UpdateFaceVector(userID string, vector []float64) error {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return err
	}
	user.FaceVector = vector
	user.FaceVectorEnrolled = true
	user.UpdatedAt = time.Now().UTC()
	return s.userRepo.Update(*user)
}

// issueToken creates a signed JWT for the given user with the given expiry.
func (s *AuthService) issueToken(user models.User, expiry time.Duration) (string, error) {
	claims := jwtClaims{
		UserID: user.ID,
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.ID,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.appConfig.JWTSecret))
}