package config

import (
	"fmt"
	"os"
	"github.com/joho/godotenv"
)

var DATABASE_URL string
var JWT_SECRET string

func LoadEnvVars() error {
	if err:= godotenv.Load(".env.sample"); err != nil {
		err = fmt.Errorf("failed to load environment variables: %w", err)
		return err
	}
	//assign env vars here itself instead of loading them everytime in each function call causing unecessary work for the cpu
	DATABASE_URL = os.Getenv("DATABASE_URL")
	JWT_SECRET = os.Getenv("JWT_SECRET")
	return nil
}