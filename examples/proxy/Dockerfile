# Use an official Golang runtime as a parent image
FROM golang:alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the source code into the container
COPY . .

# Build the frp server
RUN go build -o frps ./cmd/frps

# Use a minimal image for the final container
FROM alpine:latest

# Set the working directory inside the container
WORKDIR /root/

# Copy the built frp server from the builder stage
COPY --from=builder /app/frps .
COPY frps.ini .
# Expose the necessary ports
EXPOSE 7000 7500

# Run the frp server
CMD ["./frps", "-c", "./frps.ini"]