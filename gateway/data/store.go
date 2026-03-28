// Package data provides a simple JSON file-backed data store.
//
// Each collection (users, bookings, passengers) is stored as a JSON array
// in its own file under the configured data directory. The store provides
// typed read and write operations with file locking to prevent concurrent
// write corruption.
//
// This is intentionally a portfolio-scoped implementation — it provides a
// clean repository interface that could be backed by PostgreSQL or another
// store by swapping this package's implementations without touching any
// handler or service code.
package data

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

// fileLocks ensures concurrent requests don't corrupt JSON files during writes.
var fileLocks sync.Map

func lockFor(path string) *sync.Mutex {
	actual, _ := fileLocks.LoadOrStore(path, &sync.Mutex{})
	return actual.(*sync.Mutex)
}

// ReadAll reads all records from a JSON file into a slice of T.
// Returns an empty slice (not an error) if the file does not exist yet.
func ReadAll[T any](path string) ([]T, error) {
	mu := lockFor(path)
	mu.Lock()
	defer mu.Unlock()

	f, err := os.Open(path)
	if os.IsNotExist(err) {
		return []T{}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("opening %q: %w", path, err)
	}
	defer f.Close()

	var records []T
	if err := json.NewDecoder(f).Decode(&records); err != nil {
		return nil, fmt.Errorf("decoding %q: %w", path, err)
	}
	return records, nil
}

// WriteAll writes an entire slice of T to a JSON file, replacing its contents.
// The write is atomic — it writes to a temp file first, then renames.
func WriteAll[T any](path string, records []T) error {
	mu := lockFor(path)
	mu.Lock()
	defer mu.Unlock()

	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return fmt.Errorf("creating directories for %q: %w", path, err)
	}

	tmpPath := path + ".tmp"
	f, err := os.Create(tmpPath)
	if err != nil {
		return fmt.Errorf("creating temp file %q: %w", tmpPath, err)
	}

	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	if err := enc.Encode(records); err != nil {
		f.Close()
		os.Remove(tmpPath)
		return fmt.Errorf("encoding to %q: %w", tmpPath, err)
	}

	f.Close()

	if err := os.Rename(tmpPath, path); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("renaming temp file to %q: %w", path, err)
	}

	return nil
}

// Store holds the file paths for each collection.
type Store struct {
	UsersPath      string
	BookingsPath   string
	PassengersPath string
}

// NewStore creates a Store with paths derived from the configured data directory.
func NewStore(dataDir string) *Store {
	return &Store{
		UsersPath:      filepath.Join(dataDir, "users.json"),
		BookingsPath:   filepath.Join(dataDir, "bookings.json"),
		PassengersPath: filepath.Join(dataDir, "passengers.json"),
	}
}