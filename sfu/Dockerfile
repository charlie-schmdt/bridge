FROM debian:trixie-slim

RUN apt-get update && apt-get install -y \
    build-essential cmake git pkg-config \
    curl zip unzip wget python3 ninja-build \
    libssl-dev libuv1-dev nlohmann-json3-dev \
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/microsoft/vcpkg.git /usr/src/vcpkg
WORKDIR /usr/src/vcpkg
RUN ./bootstrap-vcpkg.sh

RUN ./vcpkg install uwebsockets usockets openssl zlib libdatachannel:x64-linux --triplet x64-linux

WORKDIR /app
COPY . .
RUN mkdir build && cd build && \
    cmake .. -DCMAKE_TOOLCHAIN_FILE=/usr/src/vcpkg/scripts/buildsystems/vcpkg.cmake && \
    cmake --build . --config Release

CMD ["./build/sfu"]