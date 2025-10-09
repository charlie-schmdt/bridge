package webrtc

import (
	"fmt"
	"sync"

	websocket "github.com/gorilla/websocket"
)

type Writer interface {
	Close()
	WriteJSON(msg any)
}

type defaultWriter struct {
	conn  *websocket.Conn
	queue chan any
	close chan struct{}
	wg    sync.WaitGroup
}

func CreateWriter(conn *websocket.Conn) Writer {
	w := &defaultWriter{
		conn:  conn,
		queue: make(chan any, 10),
	}

	w.wg.Add(1)
	go w.writeLoop()

	return w
}

func (w *defaultWriter) writeLoop() {
	defer w.wg.Done()
	for {
		select {
		case msg := <-w.queue:
			if err := w.conn.WriteJSON(msg); err != nil {
				fmt.Println("websocket write error:", err)
				return
			}
		case <-w.close:
			return
		}
	}
}

func (w *defaultWriter) Close() {
	select {
	case <-w.close:
		return
	default:
		close(w.close)
	}
	w.wg.Wait()
	w.conn.Close()
}

func (w *defaultWriter) WriteJSON(msg any) {
	select {
	case w.queue <- msg:
	case <-w.close:
		// Writer is closed
	}
}
