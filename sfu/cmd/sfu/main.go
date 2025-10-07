//go:generate protoc --go_out=../../proto --go-grpc_out=../../proto -I../../../proto ../../../proto/sfu.proto
package main

import (
	"fmt"
	"log"
	"net"
	"sfu/internal/sfu"

	pb "sfu/proto/sfu"

	"google.golang.org/grpc"

	"sfu/internal/webrtc"
)

func main() {

	// Create Router instance to handle connections
	router := sfu.NewRouter()

	// Start the WebRTC signaling server
	lis, err := net.Listen("tcp", fmt.Sprintf("0.0.0.0:%d", 50031))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	var opts []grpc.ServerOption
	grpcServer := grpc.NewServer(opts...)
	pb.RegisterSignalingServer(grpcServer, webrtc.NewSignalingServer(router))
	grpcServer.Serve(lis)
}
