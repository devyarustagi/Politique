package dtors

type MoveBuildingInfo struct {
	GlobalId    int64 `json:"global_id"`
	XCoordinate int16 `json:"x_coordinate"`
	YCoordinate int16 `json:"y_coordinate"`
}

type NewBuildingInfo struct {
	TypeID      int16  `json:"building_id"`
	XCoordinate int16  `json:"x_coordinate"`
	YCoordinate int16  `json:"y_coordinate"`
	Resource    string `json:"resource"` //oil or gems 
}
