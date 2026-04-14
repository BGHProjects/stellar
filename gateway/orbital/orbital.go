// Package orbital implements the Taunor system's orbital mechanics.
//
// All calculations use the simplified circular-orbit-with-eccentricity model
// defined in system.json. Positions are calculated as pure functions of time
// and the body's orbital parameters — no state is held between calls.
//
// The same mathematical model is implemented in TypeScript on the frontend
// (src/lib/orbital.ts). Both implementations read from the same system.json
// config values, so the frontend renderer and backend pricing logic always
// agree on where every body is.
//
// Coordinate system: 2D orbital plane, origin at system barycentre (Taunor Prime).
// Units: AU (astronomical units) for distance, days for time.
package orbital

import (
	"math"
	"time"

	"github.com/stellar/gateway/config"
)

// -----------------------------------------------------------------
// Core position calculation
// -----------------------------------------------------------------

// OrbitalParams holds the parameters needed to calculate a body's position.
// These map directly to the fields in system.json BodyConfig.
type OrbitalParams struct {
	OrbitalRadius float64 // Semi-major axis in AU
	Period        float64 // Orbital period in days
	Eccentricity  float64 // Orbital eccentricity (0 = perfect circle)
	StartPhase    float64 // Initial phase angle in degrees at epoch day 0
}

// Position calculates the 2D position of a body in its orbital plane
// at a given simulation day relative to the system epoch.
//
// Formula:
//
//	angle(T) = startPhase + (2π / period) × T
//	radius(T) = orbitalRadius × (1 - eccentricity × cos(angle))
//	x = radius × cos(angle)
//	y = radius × sin(angle)
func Position(params OrbitalParams, dayT float64) (x, y float64) {
	startPhaseRad := params.StartPhase * math.Pi / 180.0
	angle := startPhaseRad + (2*math.Pi/params.Period)*dayT
	radius := params.OrbitalRadius * (1 - params.Eccentricity*math.Cos(angle))
	return radius * math.Cos(angle), radius * math.Sin(angle)
}

// PositionVec2 is a convenience wrapper returning a [2]float64 instead of two scalars.
func PositionVec2(params OrbitalParams, dayT float64) [2]float64 {
	x, y := Position(params, dayT)
	return [2]float64{x, y}
}

// -----------------------------------------------------------------
// Moon positions — relative to parent body
// -----------------------------------------------------------------

// MoonPosition calculates the absolute system position of a moon
// by adding its orbital offset to its parent body's position.
func MoonPosition(moonParams, parentParams OrbitalParams, dayT float64) (x, y float64) {
	px, py := Position(parentParams, dayT)
	mx, my := Position(moonParams, dayT)
	return px + mx, py + my
}

// -----------------------------------------------------------------
// Distance
// -----------------------------------------------------------------

// Distance calculates the straight-line distance in AU between two bodies
// at a given simulation day.
func Distance(a, b OrbitalParams, dayT float64) float64 {
	ax, ay := Position(a, dayT)
	bx, by := Position(b, dayT)
	return math.Sqrt(math.Pow(ax-bx, 2) + math.Pow(ay-by, 2))
}

// -----------------------------------------------------------------
// Voyage duration
// -----------------------------------------------------------------

// VoyageDuration calculates the estimated journey time in days for a voyage
// between two bodies, departing on a given simulation day, aboard a ship
// travelling at a given speed in AU/day.
//
// Two refinement passes are used: the first estimates arrival day from the
// departure-day distance; the second recalculates using the destination's
// position at the estimated arrival day. This accounts for the destination
// moving during the transit. Two passes is sufficient accuracy for booking purposes.
func VoyageDuration(origin, dest OrbitalParams, departureDay, speedAUPerDay float64, refinementPasses int) float64 {
	if refinementPasses <= 0 {
		refinementPasses = 2
	}

	duration := Distance(origin, dest, departureDay) / speedAUPerDay

	for i := 1; i < refinementPasses; i++ {
		arrivalDay := departureDay + duration
		dist := Distance(origin, dest, arrivalDay)
		duration = dist / speedAUPerDay
	}

	return duration
}

// -----------------------------------------------------------------
// Orbital window rating
// -----------------------------------------------------------------

// WindowRating calculates the 1–5 star orbital window rating for a route
// on a given departure day. The rating compares the current separation between
// origin and destination against the historical min/max separation for that pair,
// calculated over one full synodic period.
//
// Rating 5 = close to minimum separation (best window, lowest price).
// Rating 1 = close to maximum separation (worst window, highest price).
func WindowRating(origin, dest OrbitalParams, departureDay float64, thresholds config.OrbitalWindowThresholds) int {
	min, max := separationRange(origin, dest, departureDay)
	current := Distance(origin, dest, departureDay)

	if max == min {
		return 3 // Degenerate case — equal distance throughout orbit
	}

	// Normalised position in [0,1] where 0 = minimum separation, 1 = maximum
	normalised := (current - min) / (max - min)

	switch {
	case normalised <= thresholds.Rating5:
		return 5
	case normalised <= thresholds.Rating4:
		return 4
	case normalised <= thresholds.Rating3:
		return 3
	case normalised <= thresholds.Rating2:
		return 2
	default:
		return 1
	}
}

// separationRange samples the distance between two bodies over one full synodic
// period starting from departureDay, returning the minimum and maximum values.
// The synodic period is approximated as the longer of the two orbital periods.
func separationRange(origin, dest OrbitalParams, fromDay float64) (min, max float64) {
	period := math.Max(origin.Period, dest.Period)
	steps := int(period) + 1

	min = math.MaxFloat64
	max = 0.0

	for i := 0; i < steps; i++ {
		d := Distance(origin, dest, fromDay+float64(i))
		if d < min {
			min = d
		}
		if d > max {
			max = d
		}
	}
	return min, max
}

// -----------------------------------------------------------------
// Closest approach search
// -----------------------------------------------------------------

// ClosestApproach searches for the day within [fromDay, fromDay+windowDays]
// at which the two bodies are at their closest. Returns the day number and distance.
// Step size is 1 day — sufficient for booking-level accuracy.
func ClosestApproach(origin, dest OrbitalParams, fromDay float64, windowDays int) (day float64, distAU float64) {
	minDist := math.MaxFloat64
	minDay := fromDay

	for i := 0; i <= windowDays; i++ {
		d := Distance(origin, dest, fromDay+float64(i))
		if d < minDist {
			minDist = d
			minDay = fromDay + float64(i)
		}
	}
	return minDay, minDist
}

// FurthestSeparation searches for the day within [fromDay, fromDay+windowDays]
// at which the two bodies are at their furthest. Returns the day number and distance.
func FurthestSeparation(origin, dest OrbitalParams, fromDay float64, windowDays int) (day float64, distAU float64) {
	maxDist := 0.0
	maxDay := fromDay

	for i := 0; i <= windowDays; i++ {
		d := Distance(origin, dest, fromDay+float64(i))
		if d > maxDist {
			maxDist = d
			maxDay = fromDay + float64(i)
		}
	}
	return maxDay, maxDist
}

// -----------------------------------------------------------------
// Simulation day helpers
// -----------------------------------------------------------------

// DayFromDate converts a calendar date to a simulation day number
// relative to the system epoch date string (format "2006-01-02").
func DayFromDate(epochDateStr string, target time.Time) (float64, error) {
	epoch, err := time.Parse("2006-01-02", epochDateStr)
	if err != nil {
		return 0, err
	}
	return target.Sub(epoch).Hours() / 24.0, nil
}

// DateFromDay converts a simulation day number back to a calendar date.
func DateFromDay(epochDateStr string, dayT float64) (time.Time, error) {
	epoch, err := time.Parse("2006-01-02", epochDateStr)
	if err != nil {
		return time.Time{}, err
	}
	return epoch.Add(time.Duration(dayT*24) * time.Hour), nil
}

// Today returns the current simulation day relative to the epoch.
func Today(epochDateStr string) (float64, error) {
	return DayFromDate(epochDateStr, time.Now().UTC())
}

// -----------------------------------------------------------------
// Config adapters — convert config structs to OrbitalParams
// -----------------------------------------------------------------

// ParamsFromBody extracts OrbitalParams from a BodyConfig.
func ParamsFromBody(b config.BodyConfig) OrbitalParams {
	return OrbitalParams{
		OrbitalRadius: b.OrbitalRadius,
		Period:        b.Period,
		Eccentricity:  b.Eccentricity,
		StartPhase:    b.StartPhase,
	}
}

// ParamsFromStar extracts OrbitalParams from a StarConfig.
func ParamsFromStar(s config.StarConfig) OrbitalParams {
	period := s.Period
	if period == 0 {
		period = 1 // Avoid division by zero for the fixed primary star
	}
	return OrbitalParams{
		OrbitalRadius: s.OrbitalRadius,
		Period:        period,
		Eccentricity:  0,
		StartPhase:    s.StartPhase,
	}
}

// -----------------------------------------------------------------
// Cryo interval bounds
// -----------------------------------------------------------------

// CryoIntervalBounds calculates the minimum and maximum number of cryo
// intervals allowed for a given journey duration, based on the cryo
// option configuration from system.json.
func CryoIntervalBounds(durationDays float64, cryoCfg config.CryoOptionConfig) (min, max int) {
	if cryoCfg.MinIntervalsPerDays <= 0 || cryoCfg.MaxIntervalsPerDays <= 0 {
		return 0, 0
	}

	minIntervals := int(math.Ceil(durationDays / cryoCfg.MaxIntervalsPerDays))
	maxIntervals := int(math.Floor(durationDays / cryoCfg.MinIntervalsPerDays))

	// Clamp to absolute bounds from config
	if minIntervals < cryoCfg.AbsoluteMinIntervals {
		minIntervals = cryoCfg.AbsoluteMinIntervals
	}
	if maxIntervals > cryoCfg.AbsoluteMaxIntervals {
		maxIntervals = cryoCfg.AbsoluteMaxIntervals
	}
	if minIntervals > maxIntervals {
		minIntervals = maxIntervals
	}

	return minIntervals, maxIntervals
}