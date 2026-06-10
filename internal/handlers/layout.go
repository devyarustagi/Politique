package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/devyarustagi/Politique/internal/dtors"
	"github.com/devyarustagi/Politique/internal/services"
)

func (h *Handler) PatchLayout(w http.ResponseWriter, r *http.Request) {
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

