package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/devyarustagi/Politique/internal/db"
	"golang.org/x/sync/errgroup"
)

type Leaderboard struct {
	Percentile      float64             `json:"user_percentile"`
	LeaderboardRows []db.LeaderboardRow `json:"leaderboard_rows"`
}

func (h *Handler) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	var l Leaderboard
	var err error
	uid, ok := ContextValueToUID(r)
	if !ok {
		http.Error(w, "malformed uid", http.StatusUnauthorized)
		return
	}
	grp, ctx:= errgroup.WithContext(r.Context())
	grp.Go(func() error {
		var e error
		l.LeaderboardRows, e = h.Queries.Leaderboard(ctx)
		return e
	})
	grp.Go(func() error {
		var e error
		l.Percentile, e = h.Queries.UserPercentile(ctx, uid)
		return e
	})
	err = grp.Wait()
	if err != nil {
		log.Printf("Error while obtaining leaderboard data: %v", err)
		http.Error(w , "internal server error", http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(l)
}
