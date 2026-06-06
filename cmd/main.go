package main

import (
	"log"
	"github.com/devyarustagi/Politique/internal/db"
	"github.com/devyarustagi/Politique/internal/router"
	"github.com/go-chi/chi/v5"
)

func main(){
	pool,err:= db.ConnectDB()
	if err != nil {
		log.Printf("Error: %v",err)
		return
	}
	log.Println("Database connection successful.")
	r:= router.RouterSetup(pool)
	
}