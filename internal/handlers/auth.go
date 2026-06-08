package handlers

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/devyarustagi/Politique/internal/db"
	"github.com/devyarustagi/Politique/internal/auth"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

var dummyHash []byte

func init(){
	dummyHash, _ = bcrypt.GenerateFromPassword([]byte("prevent_timing_attacks"), 12)
}

func issueTokens(h *Handler, uid uuid.UUID, w http.ResponseWriter, r *http.Request) bool{
	accessToken, err:= auth.GenerateJwtAccessToken(uid)
	if err != nil {
        log.Println("Error generating access token:", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return false
    }
	byteslice, err:= auth.GenerateRefreshToken()
	if err != nil {
        log.Println("Error generating refresh token:", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return false
    }
	ctx:= r.Context()
	hashArray:= sha256.Sum256(byteslice)
	err = h.Queries.UpdateRefreshToken(ctx, db.UpdateRefreshTokenParams{UserID: uid, RefreshTokenHash: hashArray[:], RefreshTokenExpiry: time.Now().Add(time.Hour * 24 * 7)})
	if err != nil{
		log.Printf("Could not store refresh token hash in db: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return false
	}
	refreshToken:= base64.URLEncoding.EncodeToString(byteslice)
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
        Expires:  time.Now().Add(time.Hour * 24 * 7), 
        HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
    }

	http.SetCookie(w, cookie1)
	http.SetCookie(w, cookie2)
	return true
}

type LoginRequest struct{
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request){
	ctx:= r.Context()
	
	var req LoginRequest
	err:= json.NewDecoder(r.Body).Decode(&req)
	defer r.Body.Close()
	if err != nil{
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	
	username:= req.Username
	password:= req.Password

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
	res, err:= h.Queries.RegisterNewUser(ctx, db.RegisterNewUserParams{Username: username, PassHash: string(passwordHash)})
	if err != nil{
		http.Error(w, "account could not be created, username already taken", http.StatusConflict)
		return
	}

	success:= issueTokens(h, res, w ,r)
	if success == false{
		return
	}
	w.WriteHeader(http.StatusCreated)
}



func (h *Handler) Login( w http.ResponseWriter, r *http.Request){
	ctx:= r.Context()

	var req LoginRequest
	err:= json.NewDecoder(r.Body).Decode(&req)
	defer r.Body.Close()
	if err != nil{
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	username:= req.Username
	password:= req.Password

	if username == "" || password == ""{
		http.Error(w, "username and password fields must not be empty", http.StatusBadRequest)
		return
	}
	res,err:= h.Queries.GetUserByName(ctx, username)
	if err != nil{
		if err == pgx.ErrNoRows{
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

    success:= issueTokens(h, res.UserID, w, r)
	if success == false{
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request){
	cookie, err:= r.Cookie("jwt-refresh-token")
	if err != nil{
		http.Error(w, "refresh token missing", http.StatusBadRequest)
		return
	}
	refreshToken, err:= base64.URLEncoding.DecodeString(cookie.Value)
	if err != nil{
		http.Error(w, "invalid refresh token", http.StatusUnauthorized)
		return
	}
	hash:= sha256.Sum256(refreshToken)
	user, err:= h.Queries.GetUserbyRTHash(r.Context(), hash[:])
	if err == pgx.ErrNoRows{
		http.Error(w, "invalid refresh token", http.StatusUnauthorized)
		return
	}
	if err != nil{
		http.Error(w, "internal server error", http.StatusInternalServerError)
		log.Printf("Could not fetch user from refresh token: %v", err)
		return
	}
	//even though the refresh token cookie might have expired yet an attacker might be able to forge
	//it even after expiration if somehow they gained access to it previously thus add this check for safety
	if time.Now().Unix() > user.RefreshTokenExpiry.Unix() {
		http.Error(w, "invalid refresh token", http.StatusUnauthorized)
		return
	}
	success:= issueTokens(h, user.UserID, w, r)
	if success == false{
		return
	}
	w.WriteHeader(http.StatusOK)
}
