package webrtc

import (
	"net/http"

	ws "github.com/gorilla/websocket"
)

var upgrader = ws.Upgrader{}

func wsHandler(w http.ResponseWriter, r *http.Request, handler func(*ws.Conn) error) {
	// Handle the WebSocket connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		panic(err)
	}
	defer conn.Close()

	err = handler(conn)
	if err != nil {
		panic(err)
	}

	// Create websocket connection

	peerConnection, err := CreatePeerConnection()

}

func ServeWebSocket(handler func(*ws.Conn) error) {
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		wsHandler(w, r, handler)
	})
	http.ListenAndServe(":8080", nil)
}
