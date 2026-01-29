import { broadcastToRoom } from "./channels.js";

export class SfuHandler {
  constructor(mediasoupService) {
    this.mediasoupService = mediasoupService;
    this.producers = new Map(); // producerId -> Producer
    this.consumers = new Map(); // consumerId -> Consumer
    this.transports = new Map(); // transportId -> Transport
  }

  async handleRequest(socket, data) {
    try {
      switch (data.type) {
        case "getRouterRtpCapabilities":
          this.handleGetRouterRtpCapabilities(socket, data);
          break;
        case "createWebRtcTransport":
          await this.handleCreateWebRtcTransport(socket, data);
          break;
        case "connectWebRtcTransport":
          await this.handleConnectWebRtcTransport(socket, data);
          break;
        case "produce":
          await this.handleProduce(socket, data);
          break;
        case "closeProducer":
          this.handleCloseProducer(socket, data);
          break;
        case "getProducers":
          this.handleGetProducers(socket, data);
          break;
        case "consume":
          await this.handleConsume(socket, data);
          break;
        case "resume":
          await this.handleResume(socket, data);
          break;
        default:
          console.warn(`[SfuHandler] Unknown request type: ${data.type}`);
      }
    } catch (err) {
      console.error(`[SfuHandler] Error handling ${data.type}:`, err);
      socket.send(
        JSON.stringify({
          type: "error",
          id: data.id,
          message: err.message,
        })
      );
    }
  }

  handleGetRouterRtpCapabilities(socket, data) {
    socket.send(
      JSON.stringify({
        type: "routerRtpCapabilities",
        id: data.id,
        routerRtpCapabilities: this.mediasoupService.router.rtpCapabilities,
      })
    );
  }

  async handleCreateWebRtcTransport(socket, data) {
    const { transport, params } = await this.mediasoupService.createWebRtcTransport();

    this.transports.set(transport.id, transport);

    // Cleanup on close
    transport.on("dtlsstatechange", (dtlsState) => {
      if (dtlsState === "closed") transport.close();
    });
    transport.on("close", () => {
      console.log("Transport closed", transport.id);
      this.transports.delete(transport.id);
    });

    socket.send(
      JSON.stringify({
        type: "createWebRtcTransportResponse",
        id: data.id,
        params,
      })
    );
  }

  async handleConnectWebRtcTransport(socket, data) {
    const transport = this.transports.get(data.transportId);
    if (transport) {
      await transport.connect({ dtlsParameters: data.dtlsParameters });
      socket.send(JSON.stringify({ type: "ack", id: data.id }));
    }
  }

  async handleProduce(socket, data) {
    const transport = this.transports.get(data.transportId);
    if (!transport) return;

    const producer = await transport.produce({
      kind: data.kind,
      rtpParameters: data.rtpParameters,
      appData: {
        ...data.appData,
        channel: socket.channel,
        uid: socket.uid,
      },
    });

    this.producers.set(producer.id, producer);

    producer.on("transportclose", () => {
      this.producers.delete(producer.id);
    });

    socket.send(
      JSON.stringify({
        type: "produceResponse",
        id: data.id,
        producerId: producer.id,
      })
    );

    // Store producer id on socket for easy tracking
    if (!socket.producers) socket.producers = {};
    if (data.appData.source === "screen") {
      socket.producers.screen = producer.id;
    } else {
      socket.producers[data.kind] = producer.id;
    }

    // Broadcast new producer to others
    broadcastToRoom(socket, {
      type: "newProducer",
      producerId: producer.id,
      kind: data.kind,
      uid: socket.uid,
      appData: producer.appData,
    });
  }

  handleCloseProducer(socket, data) {
    const producer = this.producers.get(data.producerId);
    if (!producer) return;

    producer.close();
    this.producers.delete(data.producerId);

    // Broadcast closure
    broadcastToRoom(socket, {
      type: "producerClosed",
      producerId: data.producerId,
      kind: producer.kind,
      uid: socket.uid,
    });

    // Update socket.producers
    if (socket.producers) {
      Object.keys(socket.producers).forEach((key) => {
        if (socket.producers[key] === data.producerId)
          delete socket.producers[key];
      });
    }
  }

  handleGetProducers(socket, data) {
    const producerList = [];
    for (const producer of this.producers.values()) {
      if (
        producer.appData.channel === socket.channel &&
        producer.appData.uid !== socket.uid
      ) {
        producerList.push({
          id: producer.id,
          kind: producer.kind,
          appData: producer.appData,
        });
      }
    }

    socket.send(
      JSON.stringify({
        type: "getProducersResponse",
        id: data.id,
        list: producerList,
      })
    );
  }

  async handleConsume(socket, data) {
    const transport = this.transports.get(data.transportId);
    const producer = this.producers.get(data.producerId);

    if (
      transport &&
      producer &&
      this.mediasoupService.router.canConsume({
        producerId: data.producerId,
        rtpCapabilities: data.rtpCapabilities,
      })
    ) {
      const consumer = await transport.consume({
        producerId: data.producerId,
        rtpCapabilities: data.rtpCapabilities,
        paused: true,
        appData: producer.appData,
      });

      this.consumers.set(consumer.id, consumer);

      socket.send(
        JSON.stringify({
          type: "consumeResponse",
          id: data.id,
          params: {
            id: consumer.id,
            producerId: data.producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
            appData: consumer.appData,
          },
        })
      );
    }
  }

  async handleResume(socket, data) {
    const consumer = this.consumers.get(data.consumerId);
    if (consumer) await consumer.resume();
    socket.send(JSON.stringify({ type: "resumeResponse", id: data.id }));
  }
}
