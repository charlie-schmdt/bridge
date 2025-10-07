const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const initSfuStream = () => {
    const PROTO_PATH = path.resolve("../../../proto/sfu.proto");
    const pkgDef = protoLoader.loadSync(PROTO_PATH);
    const proto = grpc.loadPackageDefinition(pkgDef).sfu;

    const client
}