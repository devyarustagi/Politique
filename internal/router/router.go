package router

import (
	"os"

	"github.com/devyarustagi/Politique/internal/handlers"
	"github.com/devyarustagi/Politique/internal/middleware"
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
	AllowCredentials: true, //setting cors config assuming my frontend and backend are on different ports, change this to false if not the case when developing frontend
	}))

	handler:= handlers.New(pool)
	r.Post("/api/auth/register", handler.Register)
	r.Post("/api/auth/login", handler.Login)
	r.Post("/api/auth/refresh", handler.Refresh) //endpoint to issue new jwt tokens

	r.Group(func(r chi.Router) {
        r.Use(middleware.JWTMiddleware)
        r.Get("/api/user/load", handler.Load)
		r.Get("/api/user/leaderboard", handler.GetLeaderboard)
		r.Get("/api/user/army", handler.GetArmy)
		r.Patch("/api/user/army", handler.PatchArmy)
		r.Patch("/api/user/layout", handler.PatchLayout)
    })

	return r
}