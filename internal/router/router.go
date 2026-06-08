package router

import (
	"os"
	"github.com/devyarustagi/Politique/internal/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
)
func RouterSetup(pool *pgxpool.Pool) *chi.Mux{
	r:= chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
    AllowedOrigins:   []string{os.Getenv("FRONTEND_URL")},
    AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowedHeaders:   []string{"Content-Type"},
	AllowCredentials: true,
	}))

	handler:= handlers.New(pool)
	r.Post("/api/auth/register", handler.Register)
	r.Post("/api/auth/login", handler.Login)
	r.Post("/api/auth/refresh", handler.Refresh) //endpoint to issue new jwt tokens
	return r
}