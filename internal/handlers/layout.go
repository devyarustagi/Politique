package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/devyarustagi/Politique/internal/dtors"
	"github.com/devyarustagi/Politique/internal/services"
)

func (h *Handler) PatchPosition(w http.ResponseWriter, r *http.Request) {
	uid, ok := ContextValueToUID(r)
	if !ok {
		http.Error(w, "malformed uid", http.StatusUnauthorized)
		return
	}
	var building dtors.MoveBuildingInfo
	if err := json.NewDecoder(r.Body).Decode(&building); err != nil {
		http.Error(w, "failed to read request body", http.StatusBadRequest)
		return
	}
	err := services.MoveBuiliding(r.Context(), h.Queries, &building, uid)
	if err != nil {
		if errors.Is(err, services.ErrInvalidPos) || errors.Is(err, services.ErrNoBuilding) {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		log.Printf("error while moving building %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) PostBuilding(w http.ResponseWriter, r *http.Request) {
	uid, ok := ContextValueToUID(r)
	if !ok {
		http.Error(w, "malformed uid", http.StatusUnauthorized)
		return
	}
	var req dtors.NewBuildingInfo
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "failed to read request body", http.StatusBadRequest)
		return
	}
	err := services.NewBuilding(r.Context(), h.Pool, &req, uid)
	if err != nil {
		if errors.Is(err, services.ErrBuildingLocked) ||
			errors.Is(err, services.ErrInsufficientFunds) ||
			errors.Is(err, services.ErrInvalidResource) ||
			errors.Is(err, services.ErrNoBuilding) ||
			errors.Is(err, services.ErrWrongLevel) ||
			errors.Is(err, services.ErrInvalidPos) {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		} else {
			log.Printf("Error while adding new building: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
	}
	w.WriteHeader(http.StatusCreated)

}

func (h *Handler) PatchLevel(w http.ResponseWriter, r *http.Request) {
	uid, ok := ContextValueToUID(r)
	if !ok {
		http.Error(w, "malformed uid", http.StatusUnauthorized)
		return
	}
	var upgradeInfo dtors.UpgradeBuildingInfo
	if err := json.NewDecoder(r.Body).Decode(&upgradeInfo); err != nil {
		http.Error(w, "request cannot be decoded", http.StatusBadRequest)
		return
	}
	err := services.UpgradeBuilding(r.Context(), h.Pool, &upgradeInfo, uid)
	if err != nil {
		if errors.Is(err, services.ErrBuildingLocked) ||
			errors.Is(err, services.ErrInsufficientFunds) ||
			errors.Is(err, services.ErrInvalidResource) ||
			errors.Is(err, services.ErrNoBuilding) {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		} else {
			log.Printf("Error while adding new building: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
	}

}
