package middleware

import (
	"net/http"

	"github.com/devyarustagi/Politique/internal/db"
	"github.com/devyarustagi/Politique/internal/handlers"
)

func UnderAttack(q *db.Queries) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            uid, ok := handlers.ContextValueToUID(r) 
			if !ok {
				http.Error(w, "malformed uid", http.StatusUnauthorized)
                return
			}
            underAttack, err := q.IsBaseUnderAttack(r.Context(), uid)
            if err != nil {
                http.Error(w, "internal server error", http.StatusInternalServerError)
                return
            }
            if underAttack {
                http.Error(w, "base is currently under attack", http.StatusConflict)
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}