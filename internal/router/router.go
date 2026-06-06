package router

import (
	"github.com/devyarustagi/Politique/internal/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)
func RouterSetup(pool *pgxpool.Pool) *chi.Mux{
	r:= chi.NewRouter()
	handler:= handlers.New(pool)
	r.Post("/register", handler.Register)

}