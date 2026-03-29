// Package handlers implements the HTTP handlers for all gateway endpoints.
// Each handler file corresponds to a logical resource group.
// Swagger annotations on each handler are used to generate the API docs
// via `swag init` — see the gateway README for usage instructions.
package handlers

import (
	"encoding/json"
	"net/http"
)

// userIDCtxKey is the context key used by the auth middleware to store
// the authenticated user ID. Must match the key set in middleware/middleware.go.
// Using a plain string (not a custom type) so both packages agree on the key
// without needing a shared import.
const userIDCtxKey = "userID"

// middleware_userID retrieves the authenticated user ID injected into the
// request context by the auth middleware. Returns empty string if not present.
func middleware_userID(r *http.Request) string {
	if id, ok := r.Context().Value(userIDCtxKey).(string); ok {
		return id
	}
	return ""
}

// respond writes a JSON response with the given status code and body.
func respond(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(body)
}

// respondError writes a JSON error response.
func respondError(w http.ResponseWriter, status int, message string) {
	respond(w, status, map[string]string{"error": message})
}

// decode decodes the JSON request body into dst, returning false and writing
// a 400 response if decoding fails.
func decode(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return false
	}
	return true
}