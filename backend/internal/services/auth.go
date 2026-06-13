package services

import (
	"crypto/rand"
	"time"
	"github.com/devyarustagi/Politique/internal/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)


func GenerateJwtAccessToken(uid uuid.UUID) ( string, error) {
	claims := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "sub": uid.String(), 
        "exp": time.Now().Add(time.Minute * 15).Unix(), 
    })
    token, err:= claims.SignedString([]byte(config.JWT_SECRET))
    return token, err
}

func GenerateRefreshToken() ([]byte, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return nil, err
	}
	return b, err
}