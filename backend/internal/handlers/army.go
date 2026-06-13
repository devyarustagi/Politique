package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/devyarustagi/Politique/internal/db"
	"github.com/devyarustagi/Politique/internal/services"
)

func (h *Handler) GetArmy(w http.ResponseWriter, r *http.Request) {
	uid, ok := ContextValueToUID(r)
	if !ok {
		http.Error(w, "malformed uid", http.StatusUnauthorized)
		return
	}

	var userArmy []db.GetUserArmyRow
	userArmy, err := h.Queries.GetUserArmy(r.Context(), uid)
	if err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userArmy) //returns null if user army is empty

}

func (h *Handler) PatchArmy(w http.ResponseWriter, r *http.Request) {
	uid, ok := ContextValueToUID(r)
	if !ok {
		http.Error(w, "malformed uid", http.StatusUnauthorized)
		return
	}
	var req []db.GetUserArmyRow
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "failed to read request body", http.StatusBadRequest)
		return
	}
	err := services.UpdateUserArmy(uid, req, h.Pool, r.Context())
	if err == services.ErrInvalidMercID || err == services.ErrMercCapacity || err == services.ErrMercNotOwned {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err != nil {
		log.Printf("Error while updating user army %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
