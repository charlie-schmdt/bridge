package main

import (
	"backend/internal"
	"log"
)

func main() {
	s := internal.NewServer()
	log.Println("Server running on :8080")
	log.Fatal(s.ListenAndServe(":8080"))
}
