package handlers

import (
	"github.com/devyarustagi/Politique/internal/db"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct{
	Pool *pgxpool.Pool
	Queries *db.Queries
}

func New(pool *pgxpool.Pool) (*Handler){
	return &Handler{Pool: pool, 
		Queries: db.New(pool),
	}
}