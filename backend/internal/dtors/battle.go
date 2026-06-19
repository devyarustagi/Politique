package dtors

import "github.com/devyarustagi/Politique/internal/db"

type OpponentInfo struct {
	Name          string                           `json:"name"`
	Karma         int32                            `json:"karma"`
	VillageLayout []db.GetDefenderVillageLayoutRow `json:"village_layout"`
}

type BattleResults struct {
	KarmaGained int   `json:"karma_gained"`
	OilLooted   int32 `json:"oil_looted"`
}
