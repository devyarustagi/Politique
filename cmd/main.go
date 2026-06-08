package main

import (
	"log"
	"net/http"
	"context"
	"fmt"
	"time"
	"github.com/devyarustagi/Politique/internal/config"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/devyarustagi/Politique/internal/router"
)

func main(){
	if err:= config.LoadEnvVars(); err != nil{
		log.Fatalf("Error: %v",err)
	}
	pool,err:= ConnectDB()
	if err != nil {
		log.Fatalf("Error: %v",err)
	}
	log.Println("Database connection successful.")
	r:= router.RouterSetup(pool)
	defer pool.Close()
	
	http.ListenAndServe(":3000", r)
	
	
}

func ConnectDB() ( *pgxpool.Pool , error ){

	ctx := context.Background()
	connectCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(connectCtx, config.DATABASE_URL)
	if err != nil {
		return nil, fmt.Errorf("failed to create database connection pool: %w", err)
	}

	if err := pool.Ping(connectCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to establish connection with database: %w", err)	
	}

	return pool, nil
}