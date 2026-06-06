package handlers

import (
	"github.com/devyarustagi/Politique/database/queries"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct{
	Pool *pgxpool.Pool
	Queries *queries.Queries
}

func New(pool *pgxpool.Pool) (*Handler){
	return &Handler{Pool: pool, 
		Queries: queries.New(pool),
	}
}