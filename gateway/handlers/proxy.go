package handlers

import (
	"io"
	"net/http"

	"github.com/stellar/gateway/services"
)

// ProxyHandler forwards requests to the Python microservices.
// The frontend never calls microservices directly.
type ProxyHandler struct {
	proxyService *services.ProxyService
}

// NewProxyHandler creates a new ProxyHandler.
func NewProxyHandler(proxyService *services.ProxyService) *ProxyHandler {
	return &ProxyHandler{proxyService: proxyService}
}

// Chat godoc
//
//	@Summary		Send a message to the AI chatbot
//	@Description	Forwards the message to the AI chatbot microservice. The chatbot is an agentic system with tools for orbital calculations, voyage search, and system knowledge retrieval. Returns a natural language response.
//	@Tags			proxy
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		chatRequest	true	"Chat message payload"
//	@Success		200		{object}	chatResponse
//	@Failure		401		{object}	map[string]string
//	@Failure		503		{object}	map[string]string	"AI service unavailable"
//	@Router			/chat [post]
func (h *ProxyHandler) Chat(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		respondError(w, http.StatusBadRequest, "failed to read request body")
		return
	}

	respBody, status, err := h.proxyService.ForwardToAI("/chat", body)
	if err != nil {
		respondError(w, status, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(respBody)
}

// EnrolFaceVector godoc
//
//	@Summary		Enrol a facial landmark vector
//	@Description	Forwards the facial landmark vector (extracted client-side by face-api.js) to the vision microservice for storage. No image data is transmitted or stored at any point — only the numeric descriptor vector.
//	@Tags			proxy
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		faceEnrolRequest	true	"Facial landmark vector payload"
//	@Success		200		{object}	map[string]string
//	@Failure		400		{object}	map[string]string
//	@Failure		401		{object}	map[string]string
//	@Failure		503		{object}	map[string]string	"Vision service unavailable"
//	@Router			/vision/enrol [post]
func (h *ProxyHandler) EnrolFaceVector(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		respondError(w, http.StatusBadRequest, "failed to read request body")
		return
	}

	respBody, status, err := h.proxyService.ForwardToVision("/enrol", body)
	if err != nil {
		respondError(w, status, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(respBody)
}

// AuthenticateFace godoc
//
//	@Summary		Authenticate using a facial landmark vector
//	@Description	Forwards the facial landmark vector to the vision microservice, which computes cosine similarity against the stored enrolled vector. Returns a JWT on successful match.
//	@Tags			proxy
//	@Accept			json
//	@Produce		json
//	@Param			body	body		faceAuthRequest	true	"Facial landmark vector payload"
//	@Success		200		{object}	services.AuthResponse
//	@Failure		401		{object}	map[string]string	"Face not recognised or not enrolled"
//	@Failure		503		{object}	map[string]string	"Vision service unavailable"
//	@Router			/vision/authenticate [post]
func (h *ProxyHandler) AuthenticateFace(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		respondError(w, http.StatusBadRequest, "failed to read request body")
		return
	}

	respBody, status, err := h.proxyService.ForwardToVision("/authenticate", body)
	if err != nil {
		respondError(w, status, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(respBody)
}

// OptimiseRoute godoc
//
//	@Summary		Optimise a multi-stop route
//	@Description	Forwards a set of required destinations to the quantum routing microservice, which uses a QAOA-inspired algorithm to find the optimal visit order minimising total journey time given current orbital positions.
//	@Tags			proxy
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		routeOptimiseRequest	true	"Route optimisation payload"
//	@Success		200		{object}	routeOptimiseResponse
//	@Failure		400		{object}	map[string]string
//	@Failure		401		{object}	map[string]string
//	@Failure		503		{object}	map[string]string	"Routing service unavailable"
//	@Router			/routing/optimise [post]
func (h *ProxyHandler) OptimiseRoute(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		respondError(w, http.StatusBadRequest, "failed to read request body")
		return
	}

	respBody, status, err := h.proxyService.ForwardToRouting("/optimise", body)
	if err != nil {
		respondError(w, status, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(respBody)
}

// -----------------------------------------------------------------
// Request / response types for Swagger schema generation
// -----------------------------------------------------------------

type chatRequest struct {
	Message      string        `json:"message"`
	ConversationHistory []chatMessage `json:"conversationHistory,omitempty"`
}

type chatMessage struct {
	Role    string `json:"role"`    // "user" or "assistant"
	Content string `json:"content"`
}

type chatResponse struct {
	Reply string `json:"reply"`
}

type faceEnrolRequest struct {
	UserID string    `json:"userId"`
	Vector []float64 `json:"vector"`
}

type faceAuthRequest struct {
	Email  string    `json:"email"`
	Vector []float64 `json:"vector"`
}

type routeOptimiseRequest struct {
	BodyIDs     []string `json:"bodyIds"`     // Ordered or unordered list of body IDs to visit
	StartBodyID string   `json:"startBodyId"` // Departure origin
	DepartureDay float64 `json:"departureDay"`
}

type routeOptimiseResponse struct {
	OptimisedOrder []string  `json:"optimisedOrder"` // Body IDs in optimal visit order
	TotalDays      float64   `json:"totalDays"`
	Legs           []routeLeg `json:"legs"`
}

type routeLeg struct {
	From       string  `json:"from"`
	To         string  `json:"to"`
	DepartDay  float64 `json:"departDay"`
	ArriveDay  float64 `json:"arriveDay"`
	DistanceAU float64 `json:"distanceAU"`
}