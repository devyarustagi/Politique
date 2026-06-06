package db

import (
	"context"
	"fmt"
	"os"
	"time"
	"github.com/joho/godotenv"
	"github.com/jackc/pgx/v5/pgxpool"
)

func ConnectDB() ( *pgxpool.Pool , error ){
	if err:= godotenv.Load(); err != nil {
		return nil, fmt.Errorf("failed to load environment variables: %w", err)
	}

	ctx := context.Background()
	connectCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(connectCtx, os.Getenv("DATABASE_URL"))
	if err != nil {
		return nil, fmt.Errorf("failed to create database connection pool: %w", err)
	}

	if err := pool.Ping(connectCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to establish connection with database: %w", err)	
	}

	return pool, nil
}