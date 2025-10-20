package main

import (
	"fmt"
	"net/http"
	"sfu/internal/sfu"

	"sfu/internal/webrtc"
)

func main() {

	// Create Router instance to handle connections
	router := sfu.NewRouter()

	// Start the websocket server
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		webrtc.HandleSession(w, r, router)
	})
	fmt.Println("Server listening on port 50051")
	http.ListenAndServe(":50051", nil)
}
