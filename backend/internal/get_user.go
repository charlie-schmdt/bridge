package internal

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func getUser(w http.ResponseWriter, r *http.Request) {
	username := chi.URLParam(r, "username")
	fmt.Fprintf(w, "User information for user: %s", username)
}
