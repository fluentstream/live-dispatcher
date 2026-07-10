import LiveDispatcher from "./liveDispatcher.js";

class CallDispatcher extends LiveDispatcher {
    constructor(options) {
        super(options);
        this.initEvent = "getCalls";
        this.namespace = "/phonecalls";
    }

    listen = () => {

        const callEventHandlers = {
            calls: "getCallsHandler",
            addLeg: "addLegHandler",
            removeLeg: "removeLegHandler",
            callConnect: "callConnectHandler",
            callDisconnect: "callDisconnectHandler",
            bridgeDestroy: "bridgeDestroyHandler",
            bridgeCreate: "bridgeCreateHandler",
            callTransfer: "callTransferHandler",
            callGroupRinging: "callGroupRingingHandler",
            callGroupAnswered: "callGroupAnsweredHandler",
            callGroupHangup: "callGroupHangupHandler",
        };

        for (const [event, handler] of Object.entries(callEventHandlers)) {
            if (typeof this[handler] === "function") {
                this.connection.on(event, this[handler]);
            }
        }
    };

    getCalls = () => {
        this.connection.emit("getCalls", this.tenant);
    };
}

export default CallDispatcher;
