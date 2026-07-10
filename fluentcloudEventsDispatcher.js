import LiveDispatcher from "./liveDispatcher.js";

class FluentCloudEventsDispatcher extends LiveDispatcher {

    constructor(options) {
        super(options);
        this.namespace = "/fluentcloudevents";
        this.initEvent = "getCalls";
    }

    listen() {

        if (typeof this.newInboundCallHandler === "function") {
            this.connection.on("newInboundCall", this.newInboundCallHandler);
        }
    }

    getCalls(options) {
        return this.connection.emit("getCalls", options);
    }
}

export default FluentCloudEventsDispatcher;
