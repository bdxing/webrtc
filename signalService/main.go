package main

import (
	"fmt"
	"github.com/googollee/go-socket.io/engineio"
	"github.com/googollee/go-socket.io/engineio/transport"
	"github.com/googollee/go-socket.io/engineio/transport/polling"
	"github.com/googollee/go-socket.io/engineio/transport/websocket"
	"log"
	"net/http"

	socketio "github.com/googollee/go-socket.io"
)

var allowOriginFunc = func(r *http.Request) bool {
	return true
}

// socket.io-client version 1.4
func main() {
	server := socketio.NewServer(&engineio.Options{
		Transports: []transport.Transport{
			&polling.Transport{
				CheckOrigin: allowOriginFunc,
			},
			&websocket.Transport{
				CheckOrigin: allowOriginFunc,
			},
		},
	})

	server.OnConnect("/", func(s socketio.Conn) error {
		s.SetContext("")
		fmt.Println("connected:", s.ID())
		s.Join("bcast")
		return nil
	})

	server.OnEvent("/", "test", func(s socketio.Conn, msg string) {
		fmt.Println(s.Context(), msg)
	})

	server.OnEvent("/", "join", func(s socketio.Conn, msg string) {
		server.ForEach("/", "bcast", func(conn socketio.Conn) {
			if conn.ID() == s.ID() {
				return
			}
			conn.Emit("join", "join")
		})
	})

	server.OnEvent("/", "offer", func(s socketio.Conn, msg string) {
		server.ForEach("/", "bcast", func(conn socketio.Conn) {
			if conn.ID() == s.ID() {
				return
			}
			conn.Emit("offer", msg)
		})
	})

	server.OnEvent("/", "answer", func(s socketio.Conn, msg string) {
		server.ForEach("/", "bcast", func(conn socketio.Conn) {
			if conn.ID() == s.ID() {
				return
			}
			conn.Emit("answer", msg)
		})
	})

	server.OnEvent("/", "icecandidate", func(s socketio.Conn, msg string) {
		server.ForEach("/", "bcast", func(conn socketio.Conn) {
			if conn.ID() == s.ID() {
				return
			}
			conn.Emit("icecandidate", msg)
		})
	})

	server.OnDisconnect("/", func(s socketio.Conn, msg string) {
		fmt.Println("OnDisconnect: ",s.ID(), msg)
	})

	go func() {
		if err := server.Serve(); err != nil {
			log.Fatalf("socketio listen error: %s\n", err)
		}
	}()

	defer server.Close()

	http.Handle("/socket.io/", server)
	log.Println("Serving at localhost:888...")
	log.Fatal(http.ListenAndServeTLS(":888",
		"../../h5Client/test.com.pem","../../h5Client/test.com-key.pem",nil))
}
