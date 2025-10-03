cmake_minimum_required(VERSION 3.3)
project(sfu)

find_package(LibDataChannel REQUIRED)
find_package(OpenSSL REQUIRED)
find_package(ZLIB REQUIRED)

add_executable(sfu src/main.cpp)
target_link_libraries(sfu LibDataChannel::LibDataChannel OpenSSL::SSL OpenSSL::Crypto ZLIB::ZLIB)