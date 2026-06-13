package handlers
/*
import (
	"net/http"

	"github.com/devyarustagi/Politique/internal/services"
)
	*/
/*
func (h *Handler) StartBattle(w http.ResponseWriter, r *http.Request) {
	uid, ok := ContextValueToUID(r)
	if !ok {
		http.Error(w, "malformed uid", http.StatusUnauthorized)
		return
	}
	opponentUID, err := services.Matchmake(r.Context(), h.Pool, uid)
	if err != nil {
		if err == services.ErrInBattle {
			http.Error(w, services.ErrInBattle.Error(), http.StatusConflict)
			return
		}
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	//complete remaining to send the user the data of the opponent's base
}
*/