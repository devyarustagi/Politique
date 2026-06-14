package dtors

import (
	"github.com/devyarustagi/Politique/internal/db"
)

type LoadInfo struct {
	Buildings     []db.BuildingsMasterTable    `json:"buildings_master_table"`
	Defenses      []db.Defense                 `json:"defenses"`
	Storages      []db.Storage                 `json:"storages"`
	Collectors    []db.Collector               `json:"collectors"`
	Mercenaries   []db.Mercenary               `json:"mercs"`
	Tiers         []db.Tier                    `json:"tiers"`
	Army          []db.GetUserArmyRow          `json:"army"`
	Residence     db.GetResidenceInfoRow       `json:"residence"`
	Stats         db.GetUserStatsRow           `json:"stats"`
	VillageLayout []db.GetUserVillageLayoutRow `json:"village_layout"`
}
