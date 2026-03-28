package services

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"time"
)

// ProxyService forwards requests from the gateway to the Python microservices.
// The frontend never calls microservices directly — all traffic goes through here.
type ProxyService struct {
	client           *http.Client
	aiServiceURL     string
	visionServiceURL string
	routingServiceURL string
}

// NewProxyService creates a new ProxyService with the given microservice URLs.
// An empty URL for a service disables that proxy endpoint.
func NewProxyService(aiURL, visionURL, routingURL string) *ProxyService {
	return &ProxyService{
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
		aiServiceURL:      aiURL,
		visionServiceURL:  visionURL,
		routingServiceURL: routingURL,
	}
}

// ForwardToAI proxies a request body to the AI chatbot service and returns the response body.
func (s *ProxyService) ForwardToAI(path string, body []byte) ([]byte, int, error) {
	if s.aiServiceURL == "" {
		return nil, http.StatusServiceUnavailable, fmt.Errorf("AI service is not configured")
	}
	return s.forward(s.aiServiceURL+path, body)
}

// ForwardToVision proxies a request body to the vision service and returns the response body.
func (s *ProxyService) ForwardToVision(path string, body []byte) ([]byte, int, error) {
	if s.visionServiceURL == "" {
		return nil, http.StatusServiceUnavailable, fmt.Errorf("vision service is not configured")
	}
	return s.forward(s.visionServiceURL+path, body)
}

// ForwardToRouting proxies a request body to the quantum routing service.
func (s *ProxyService) ForwardToRouting(path string, body []byte) ([]byte, int, error) {
	if s.routingServiceURL == "" {
		return nil, http.StatusServiceUnavailable, fmt.Errorf("routing service is not configured")
	}
	return s.forward(s.routingServiceURL+path, body)
}

func (s *ProxyService) forward(url string, body []byte) ([]byte, int, error) {
	resp, err := s.client.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, http.StatusBadGateway, fmt.Errorf("forwarding to %q: %w", url, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, http.StatusBadGateway, fmt.Errorf("reading response from %q: %w", url, err)
	}

	return respBody, resp.StatusCode, nil
}