package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/devyarustagi/Politique/internal/dtors"
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
		switch err {
		case services.ErrInBattle:
			http.Error(w, err.Error(), http.StatusConflict)
			return
		case services.ErrNoOpponentFound:
			w.WriteHeader(http.StatusOK)
			response := dtors.OpponentInfo{
				IsValid: false,
			}
			json.NewEncoder(w).Encode(response)
			return
		default:
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
	}
	opponentData, err := services.GetOpponentData(r.Context(), h.Pool, opponentUID)
	if err != nil {
		log.Printf("%v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(opponentData)
}

func (h *Handler) FinishBattle(w http.ResponseWriter, r *http.Request) {
	uid, ok := ContextValueToUID(r)
	if !ok {
		http.Error(w, "malformed uid", http.StatusUnauthorized)
		return
	}
	var result dtors.BattleResults
	if err := json.NewDecoder(r.Body).Decode(&result); err != nil {
		http.Error(w, "failed to read request body", http.StatusBadRequest)
		return
	}
	err := services.FinishBattle(r.Context(), h.Pool, uid, result)
	if err != nil {
		log.Printf("%v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	
}