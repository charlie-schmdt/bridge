FROM golang:1.25-trixie

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go build -o sfu ./cmd/sfu

EXPOSE 50051

CMD ["./sfu"]