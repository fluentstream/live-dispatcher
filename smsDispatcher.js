import LiveDispatcher from "./liveDispatcher.js";

class SmsDispatcher extends LiveDispatcher {
    constructor(options) {
        super(options);
        this.initEvent = "getCalls";
        this.namespace = "/smsMessages";
    }

    listen = () => {

        const smsEventHandlers = {
            smsMessage: "smsMessageHandler",
            smsMessageIncoming: "smsMessageIncomingHandler",
        };

        for (const [event, handler] of Object.entries(smsEventHandlers)) {
            if (typeof this[handler] === "function") {
                this.connection.on(event, this[handler]);
            }
        }
    };
}

export default SmsDispatcher;
