module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*" // Match any network id
        },
        kovan: {
            host: "localhost",
            port: 8545,
            network_id: 42
        }
    }
};