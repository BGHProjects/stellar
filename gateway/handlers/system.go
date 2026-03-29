package handlers

import (
	"net/http"

	"github.com/stellar/gateway/config"
)

// SystemHandler serves read-only system config data to the frontend.
// All responses are derived directly from system.json — no database calls.
// These endpoints are public (no auth required).
type SystemHandler struct {
	sysCfg *config.SystemConfig
}

// NewSystemHandler creates a new SystemHandler.
func NewSystemHandler(sysCfg *config.SystemConfig) *SystemHandler {
	return &SystemHandler{sysCfg: sysCfg}
}

// GetBodies godoc
//
//	@Summary		Get all orbital bodies
//	@Description	Returns all stars, planets, and moons in the Solara system including their orbital parameters, render properties, and visitation status. Used by the frontend 3D renderer and the explore mode star map.
//	@Tags			system
//	@Produce		json
//	@Success		200	{object}	systemBodiesResponse
//	@Router			/system/bodies [get]
func (h *SystemHandler) GetBodies(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, systemBodiesResponse{
		Stars:            h.sysCfg.Stars,
		LagrangeStations: h.sysCfg.LagrangeStations,
		Bodies:           h.sysCfg.Bodies,
		Simulation:       h.sysCfg.Simulation,
		Epoch:            h.sysCfg.Epoch,
	})
}

// GetRoutes godoc
//
//	@Summary		Get all scheduled routes
//	@Description	Returns all defined routes in the network including origin, destination, ship class, frequency, and available route types. Used to populate search filters and the route map.
//	@Tags			system
//	@Produce		json
//	@Success		200	{object}	[]config.RouteConfig
//	@Router			/system/routes [get]
func (h *SystemHandler) GetRoutes(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, h.sysCfg.Routes)
}

// GetShips godoc
//
//	@Summary		Get all ship classes
//	@Description	Returns all ship classes with speed, capacity, cryo options, cabin classes, and available route types.
//	@Tags			system
//	@Produce		json
//	@Success		200	{object}	[]config.ShipClassConfig
//	@Router			/system/ships [get]
func (h *SystemHandler) GetShips(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, h.sysCfg.ShipClasses)
}

// GetSpaceports godoc
//
//	@Summary		Get all spaceports
//	@Description	Returns all spaceports across the system with their parent body, type, and description.
//	@Tags			system
//	@Produce		json
//	@Success		200	{object}	[]config.SpaceportConfig
//	@Router			/system/spaceports [get]
func (h *SystemHandler) GetSpaceports(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, h.sysCfg.Spaceports)
}

// GetCabinClasses godoc
//
//	@Summary		Get all cabin classes
//	@Description	Returns all cabin class definitions with price multipliers, amenity tiers, and cryo compatibility.
//	@Tags			system
//	@Produce		json
//	@Success		200	{object}	[]config.CabinClassConfig
//	@Router			/system/cabin-classes [get]
func (h *SystemHandler) GetCabinClasses(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, h.sysCfg.CabinClasses)
}

// GetCryoOptions godoc
//
//	@Summary		Get all cryostasis options
//	@Description	Returns all cryo options with price multipliers, amenity access flags, and interval bounds.
//	@Tags			system
//	@Produce		json
//	@Success		200	{object}	[]config.CryoOptionConfig
//	@Router			/system/cryo-options [get]
func (h *SystemHandler) GetCryoOptions(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, h.sysCfg.CryoOptions)
}

// GetAddOns godoc
//
//	@Summary		Get all available add-ons
//	@Description	Returns all bookable add-ons grouped by category (journeyProtection, dining, recreation, entertainment, expeditionExtras) with pricing and availability constraints.
//	@Tags			system
//	@Produce		json
//	@Success		200	{object}	config.AddOnsConfig
//	@Router			/system/add-ons [get]
func (h *SystemHandler) GetAddOns(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, h.sysCfg.AddOns)
}

// GetLoyaltyTiers godoc
//
//	@Summary		Get loyalty programme tiers
//	@Description	Returns all loyalty tier definitions with point thresholds and benefits.
//	@Tags			system
//	@Produce		json
//	@Success		200	{object}	[]config.LoyaltyTierConfig
//	@Router			/system/loyalty-tiers [get]
func (h *SystemHandler) GetLoyaltyTiers(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, h.sysCfg.LoyaltyTiers)
}

// GetPricing godoc
//
//	@Summary		Get pricing configuration
//	@Description	Returns the full pricing configuration including currency, orbital window multipliers, child discount, and loyalty point rates. Used by the frontend to display price calculations transparently.
//	@Tags			system
//	@Produce		json
//	@Success		200	{object}	config.PricingConfig
//	@Router			/system/pricing [get]
func (h *SystemHandler) GetPricing(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, h.sysCfg.Pricing)
}

// -----------------------------------------------------------------
// Response wrapper types (for Swagger schema generation)
// -----------------------------------------------------------------

type systemBodiesResponse struct {
	Stars            []config.StarConfig      `json:"stars"`
	LagrangeStations []config.LagrangeConfig  `json:"lagrangeStations"`
	Bodies           []config.BodyConfig      `json:"bodies"`
	Simulation       config.SimulationConfig  `json:"simulation"`
	Epoch            config.EpochConfig       `json:"epoch"`
}