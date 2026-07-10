import LiveDispatcher from "./liveDispatcher.js";

class PhoneStatusDispatcher extends LiveDispatcher {
    constructor(options) {
        super(options);
        this.initEvent = "getPeers";
        this.namespace = "/phonestatus";
    }

    listen = () => {

        const phoneStatusEventHandlers = {
            status: "peerStatusHandler",
            peers: "getPeersHandler",
        };

        for (const [event, handler] of Object.entries(phoneStatusEventHandlers)) {
            if (typeof this[handler] === "function") {
                this.connection.on(event, this[handler]);
            }
        }
    };

    getPeers = () => {
        this.connection.emit("getPeers", this.tenant);
    };
}

export default PhoneStatusDispatcher;
