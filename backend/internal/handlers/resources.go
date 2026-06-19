package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/devyarustagi/Politique/internal/dtors"
	"github.com/devyarustagi/Politique/internal/services"
)

func (h *Handler) PatchResources(w http.ResponseWriter, r *http.Request){
	uid, ok := ContextValueToUID(r)
	if !ok {
		http.Error(w, "malformed uid", http.StatusUnauthorized)
		return
	}
	var req dtors.CollectResourceInfo
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "failed to read request body", http.StatusBadRequest)
		return
	}
	var amt dtors.AmtCollected
	amt, err := services.CollectResource(uid, req, h.Pool, r.Context())
	if err != nil {
		log.Printf("%v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(amt)
}