package handlers

import (
	"net/http"

	"github.com/stellar/gateway/services"
)

// AuthHandler holds the dependencies for auth endpoints.
type AuthHandler struct {
	authService *services.AuthService
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Register godoc
//
//	@Summary		Register a new user account
//	@Description	Creates a new passenger account. Returns JWT access and refresh tokens on success.
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		services.RegisterRequest	true	"Registration payload"
//	@Success		201		{object}	services.AuthResponse
//	@Failure		400		{object}	map[string]string
//	@Failure		409		{object}	map[string]string	"Email already registered"
//	@Router			/auth/register [post]
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req services.RegisterRequest
	if !decode(w, r, &req) {
		return
	}

	resp, err := h.authService.Register(req)
	if err != nil {
		// Distinguish duplicate email (409) from other errors (400)
		if err.Error() == "an account with that email address already exists" {
			respondError(w, http.StatusConflict, err.Error())
			return
		}
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respond(w, http.StatusCreated, resp)
}

// Login godoc
//
//	@Summary		Log in to an existing account
//	@Description	Validates credentials and returns JWT access and refresh tokens.
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		services.LoginRequest	true	"Login payload"
//	@Success		200		{object}	services.AuthResponse
//	@Failure		400		{object}	map[string]string
//	@Failure		401		{object}	map[string]string	"Invalid credentials"
//	@Router			/auth/login [post]
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req services.LoginRequest
	if !decode(w, r, &req) {
		return
	}

	resp, err := h.authService.Login(req)
	if err != nil {
		respondError(w, http.StatusUnauthorized, err.Error())
		return
	}

	respond(w, http.StatusOK, resp)
}

// Refresh godoc
//
//	@Summary		Refresh access token
//	@Description	Issues a new access/refresh token pair given a valid refresh token.
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		refreshRequest	true	"Refresh token payload"
//	@Success		200		{object}	services.AuthResponse
//	@Failure		401		{object}	map[string]string
//	@Router			/auth/refresh [post]
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req refreshRequest
	if !decode(w, r, &req) {
		return
	}

	resp, err := h.authService.RefreshTokens(req.RefreshToken)
	if err != nil {
		respondError(w, http.StatusUnauthorized, err.Error())
		return
	}

	respond(w, http.StatusOK, resp)
}

// GetMe godoc
//
//	@Summary		Get the authenticated user's profile
//	@Description	Returns the public profile of the currently authenticated user.
//	@Tags			auth
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	models.UserPublic
//	@Failure		401	{object}	map[string]string
//	@Failure		404	{object}	map[string]string
//	@Router			/auth/me [get]
func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID := middleware_userID(r)

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		respondError(w, http.StatusNotFound, "user not found")
		return
	}

	respond(w, http.StatusOK, user.ToPublic())
}

// UpdateFaceVector godoc
//
//	@Summary		Enrol or update facial landmark vector
//	@Description	Stores the facial landmark vector extracted client-side by face-api.js. No image data is accepted or stored — only the numeric vector.
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		faceVectorRequest	true	"Facial landmark vector"
//	@Success		200		{object}	map[string]string
//	@Failure		400		{object}	map[string]string
//	@Failure		401		{object}	map[string]string
//	@Router			/auth/face-vector [post]
func (h *AuthHandler) UpdateFaceVector(w http.ResponseWriter, r *http.Request) {
	userID := middleware_userID(r)

	var req faceVectorRequest
	if !decode(w, r, &req) {
		return
	}
	if len(req.Vector) == 0 {
		respondError(w, http.StatusBadRequest, "vector must not be empty")
		return
	}

	if err := h.authService.UpdateFaceVector(userID, req.Vector); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update face vector")
		return
	}

	respond(w, http.StatusOK, map[string]string{"message": "facial landmark vector enrolled successfully"})
}

// FaceLogin godoc
//
//	@Summary		Log in using face authentication
//	@Description	Issues JWT tokens for a user whose identity was confirmed by the vision service. No password required — face verification is the credential.
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		services.FaceLoginRequest	true	"Face login payload"
//	@Success		200		{object}	services.AuthResponse
//	@Failure		400		{object}	map[string]string
//	@Failure		401		{object}	map[string]string
//	@Router			/auth/face-login [post]
func (h *AuthHandler) FaceLogin(w http.ResponseWriter, r *http.Request) {
	var req services.FaceLoginRequest
	if !decode(w, r, &req) {
		return
	}

	resp, err := h.authService.FaceLogin(req)
	if err != nil {
		respondError(w, http.StatusUnauthorized, err.Error())
		return
	}

	respond(w, http.StatusOK, resp)
}

// -----------------------------------------------------------------
// Request types local to this handler
// -----------------------------------------------------------------

type refreshRequest struct {
	RefreshToken string `json:"refreshToken"`
}

type faceVectorRequest struct {
	// Vector is the 128-dimensional facial landmark descriptor produced by face-api.js.
	// Only numeric data is accepted — no image or raw biometric data.
	Vector []float64 `json:"vector"`
}