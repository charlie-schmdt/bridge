#include <iostream>
#include <thread>
#include <chrono>
#include <optional>
#include <nlohmann/json.hpp>

#include "rtc/rtc.hpp"

using nlohmann::json;

struct Receiver {
    std::shared_ptr<rtc::PeerConnection> conn;
    std::shared_ptr<rtc::Track> videoTrack;
};

rtc::WebSocket ws;

int main() {

    std::vector<std::shared_ptr<Receiver>> receivers;

    try {
        rtc::InitLogger(rtc::LogLevel::Info);
        std::shared_ptr<rtc::PeerConnection> pc = std::make_shared<rtc::PeerConnection>();

        pc->onStateChange(
            [](rtc::PeerConnection::State state) { std::cout << "State: " << state << std::endl; });
        pc->onGatheringStateChange([pc](rtc::PeerConnection::GatheringState state) {
            std::cout << "Gathering State: " << state << std::endl;
            if (state == rtc::PeerConnection::GatheringState::Complete) {
                std::optional<rtc::Description> description = pc->localDescription();
                json message = {{"type", description->typeString()},
                                {"sdp", std::string(description.value())}};
                std::cout << "Please copy/paste this offer to the SENDER: " << message << std::endl;
            }
        });

        rtc::Description::Video media("video", rtc::Description::Direction::RecvOnly);
        media.addH264Codec(96);
        media.setBitrate(3000);

        std::shared_ptr<rtc::Track> track = pc->addTrack(media);

        track->setMediaHandler(std::make_shared<rtc::RtcpReceivingSession>());

        const rtc::SSRC targetSSRC = 42;
        track->onMessage(
            [&receivers, targetSSRC](rtc::binary message) {
                // This is an RTP packet
                rtc::RtpHeader * rtp = reinterpret_cast<rtc::RtpHeader *>(message.data());
                for (auto pc : receivers) {
                    if (pc->videoTrack != nullptr && pc->videoTrack->isOpen()) {
                        pc->videoTrack->send(message);
                    }
                }
            },
            nullptr);

        pc->setLocalDescription();

        // Set the sender's answer
        std::cout << "Please copy/paste the answer provided by the SENDER: " << std::endl;
        std::string sdp;
        std::getline(std::cin, sdp);
        std::cout << "Got answer" << sdp << std::endl;
        json j = json::parse(sdp);
        rtc::Description answer(j["sdp"].get<std::string>(), j["type"].get<std::string>());
        pc->setRemoteDescription(answer);

        // For each receiver
        while (true) {
            std::shared_ptr<Receiver> r = std::make_shared<Receiver>();
            r->conn = std::make_shared<rtc::PeerConnection>();
            r->conn->onStateChange([](rtc::PeerConnection::State state) {
                std::cout << "State: " << state << std::endl;
            });
        }


    }

    ws.onOpen([]() {
        std::cout << "WebSocket connection opened" << std::endl;
    });

    ws.onMessage([](std::variant<rtc::binary, rtc::string> message) {
        if (std::holds_alternative<rtc::string>(message)) {
            std::cout << "WebSocket received" << std::get<rtc::string>(message) << std::endl;
        }
    });

    std::cout << "about to open websocket" << std::endl;
    ws.open("ws://localhost:8081");

    while (true) {
        std::this_thread::sleep_for(std::chrono::seconds(10));
    }
}
