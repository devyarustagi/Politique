package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/devyarustagi/Politique/internal/services"
)
func (h *Handler) StartBattle(w http.ResponseWriter, r *http.Request) {
	uid, ok := ContextValueToUID(r)
	if !ok {
		http.Error(w, "malformed uid", http.StatusUnauthorized)
		return
	}
	opponentUID, err := services.Matchmake(r.Context(), h.Pool, uid)
	if err != nil {
		log.Printf("%v",err)
		if err == services.ErrInBattle {
			http.Error(w, services.ErrInBattle.Error(), http.StatusConflict)
			return
		}
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	opponentData, err := services.GetOpponentData(r.Context(), h.Pool, opponentUID)
	if err != nil {
		log.Printf("%v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(opponentData)
}
