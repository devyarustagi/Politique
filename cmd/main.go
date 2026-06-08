package main

import (
	"log"
	"net/http"

	"github.com/devyarustagi/Politique/internal/config"
	"github.com/devyarustagi/Politique/internal/db"
	"github.com/devyarustagi/Politique/internal/router"
)


func main(){
	if err:= config.LoadEnvVars(); err != nil{
		log.Printf("Error: %v",err)
		return
	}
	pool,err:= db.ConnectDB()
	if err != nil {
		log.Printf("Error: %v",err)
		return
	}
	log.Println("Database connection successful.")
	r:= router.RouterSetup(pool)
	http.ListenAndServe(":3000", r)
	
}