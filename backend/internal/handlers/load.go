package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/devyarustagi/Politique/internal/config"
	"github.com/devyarustagi/Politique/internal/dtors"
	"golang.org/x/sync/errgroup"
)

func (h *Handler) Load(w http.ResponseWriter, r *http.Request) {
	uid, ok := ContextValueToUID(r)
	if !ok {
		http.Error(w, "malformed uid", http.StatusUnauthorized)
		return
	}
	LoadInfo := dtors.LoadInfo{
		Buildings:   config.BMT,
		Defenses:    config.Defenses,
		Storages:    config.Storages,
		Collectors:  config.Collectors,
		Mercenaries: config.Mercs,
		Tiers:       config.Tiers,
	}
	grp, ctx:= errgroup.WithContext(r.Context())
	grp.Go(func() error {
		var e error
		LoadInfo.Army, e = h.Queries.GetUserArmy(ctx, uid)
		return e
	})
	grp.Go(func() error {
		var e error
		LoadInfo.VillageLayout, e = h.Queries.GetUserVillageLayout(ctx, uid)
		return e
	})
	grp.Go(func() error {
		var e error
		LoadInfo.Stats, e = h.Queries.GetUserStats(ctx, uid)
		return e
	})
	grp.Go(func() error {
		var e error
		LoadInfo.Residence, e = h.Queries.GetResidenceInfo(ctx, uid)
		return e
	})
	err := grp.Wait()
	if err != nil {
		log.Printf("Error while obtaining game load data: %v", err)
		http.Error(w , "internal server error", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(LoadInfo)
	
}
