package handlers

import (
	"log"
	"net/http"
	"github.com/devyarustagi/Politique/database/queries"
	"golang.org/x/crypto/bcrypt"
)

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
	err = h.Queries.RegisterNewUser(ctx, queries.RegisterNewUserParams{Username: username, PassHash: string(passwordHash)})
	if err != nil{
		http.Error(w, "account could not be created, username already taken", http.StatusConflict)
		return
	}
	w.Header().Set("Content-Type", "text/plain; charset=UTF-8")
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`message: Registration Successful`))
}

