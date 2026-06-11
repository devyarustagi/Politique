package middleware

import (
	"context"
	"net/http"
	"github.com/devyarustagi/Politique/internal/config"
	"github.com/golang-jwt/jwt/v5"
)

func JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	cookie, err:= r.Cookie("jwt-access-token")
	if err == http.ErrNoCookie {
		http.Error(w, "jwt access token missing", http.StatusUnauthorized)
		return
	}
	jwtToken:= cookie.Value
	claims:= &jwt.RegisteredClaims{}

	token, err:= jwt.ParseWithClaims(jwtToken, claims, func (*jwt.Token) (interface{}, error) {
		return []byte(config.JWT_SECRET), nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "invalid jwt token", http.StatusUnauthorized)
		return
	}

    ctx := context.WithValue(r.Context(), "user_id", claims.Subject)
    next.ServeHTTP(w, r.WithContext(ctx))
  })
}

