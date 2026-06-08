package router

import (
	"github.com/devyarustagi/Politique/internal/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)
func RouterSetup(pool *pgxpool.Pool) *chi.Mux{
	r:= chi.NewRouter()
	handler:= handlers.New(pool)
	r.Post("/auth/register", handler.Register)
	r.Post("/auth/login", handler.Login)
	r.Post("/auth/refresh", handler.Refresh) //endpoint to issue new jwt tokens
	return r
}