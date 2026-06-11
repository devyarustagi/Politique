package handlers

import (
	"net/http"

	"github.com/google/uuid"
)
//refactor this later and move to separate utils folder
func ContextValueToUID(r *http.Request) (uuid.UUID, bool){
	uidStr, ok := r.Context().Value("user_id").(string)
	if !ok {
		return uuid.UUID{}, false
	}
	uid, err := uuid.Parse(uidStr)
	if err != nil {
		return uuid.UUID{}, false
	}
	return uid, true
}
