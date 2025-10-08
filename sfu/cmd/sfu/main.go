//go:generate protoc --go_out=../../proto --go-grpc_out=../../proto -I../../../proto ../../../proto/sfu.proto
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
	fmt.Println("Server listening on port 50031")
	http.ListenAndServe(":50031", nil)
}
