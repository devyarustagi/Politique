package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"log"
	"net/http"
	"time"
	"github.com/devyarustagi/Politique/database/queries"
	"github.com/devyarustagi/Politique/internal/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var dummyHash []byte

func init(){
	dummyHash, _ = bcrypt.GenerateFromPassword([]byte("prevent_timing_attacks"), 12)
}

func issueTokensAndRedirect(uid uuid.UUID, w http.ResponseWriter, r *http.Request){
	accessToken, err:= GenerateJwtAccessToken(uid)
	if err != nil {
        log.Println("Error generating token:", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
    }
	refreshToken, _:= GenerateRefreshToken()
    cookie1 := &http.Cookie{
        Name: "jwt-access-token",
        Value: accessToken,
		Path: "/",
        Expires:  time.Now().Add(time.Minute * 15), 
        HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
    }
	cookie2 := &http.Cookie{
        Name: "jwt-refresh-token",
        Value: refreshToken,
		Path: "/",
        Expires:  time.Now().Add(time.Hour * 24), 
        HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
    }

	http.SetCookie(w, cookie1)
	http.SetCookie(w, cookie2)
	http.Redirect(w, r, "/residence", http.StatusSeeOther)
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request){
	ctx:= r.Context()
	r.ParseForm()
	username:= r.PostForm.Get("username")
	password:= r.PostForm.Get("password")
	if username == "" || password == ""{
		http.Error(w, "username and password fields are required", http.StatusBadRequest)
		return
	}
	if len(password) > 72{
		http.Error(w, "password must not be longer than 72 characters", http.StatusBadRequest)
		return
	}
	passwordHash, err:= bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		log.Printf("bcrypt hash failed: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	res, err:= h.Queries.RegisterNewUser(ctx, queries.RegisterNewUserParams{Username: username, PassHash: string(passwordHash)})
	if err != nil{
		http.Error(w, "account could not be created, username already taken", http.StatusConflict)
		return
	}
	issueTokensAndRedirect(res, w ,r)
}

func GenerateJwtAccessToken(uid uuid.UUID) ( string, error) {
	claims := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "sub": uid.String(), 
        "exp": time.Now().Add(time.Minute * 15).Unix(), 
    })
    token, err:= claims.SignedString([]byte(config.JWT_SECRET))
    return token, err
}

func GenerateRefreshToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}

	return base64.URLEncoding.EncodeToString(b), err
}


func (h *Handler) Login( w http.ResponseWriter, r *http.Request){
	ctx:= r.Context()
	r.ParseForm()
	username:= r.PostForm.Get("username")
	password:= r.PostForm.Get("password")
	if username == "" || password == ""{
		http.Error(w, "username and password fields must not be empty", http.StatusBadRequest)
		return
	}
	res,err:= h.Queries.GetUserByName(ctx, username)
	if err != nil{
		if err == sql.ErrNoRows{
			bcrypt.CompareHashAndPassword(dummyHash, []byte(password)) //to prevent any sort of timing attacks
			http.Error(w, "invalid username or password", http.StatusUnauthorized)
			return
		}
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	if err:= bcrypt.CompareHashAndPassword([]byte(res.PassHash), []byte(password)); err != nil{
		http.Error(w, "invalid username or password", http.StatusUnauthorized)
		return
	}
    issueTokensAndRedirect(res.UserID, w, r)
}
