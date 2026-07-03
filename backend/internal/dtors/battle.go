package dtors

import "github.com/devyarustagi/Politique/internal/db"

type OpponentInfo struct {
	IsValid       bool                             `json:"is_valid"`
	Name          string                           `json:"name"`
	Karma         int32                            `json:"karma"`
	Oil           int32                            `json:"loot_available"`
	VillageLayout []db.GetDefenderVillageLayoutRow `json:"village_layout"`
}

type BattleResults struct {
	KarmaGained int   `json:"karma_gained"`
	OilLooted   int32 `json:"oil_looted"`
}
