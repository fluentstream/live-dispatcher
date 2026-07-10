import LiveDispatcher from "./liveDispatcher.js";

class QueueDispatcher extends LiveDispatcher {
    constructor(options) {
        super(options);
        this.initEvent = "getQueues";
        this.namespace = "/liveQueues";
    }

    listen = () => {

        const queueEventHandlers = {
            addQueue: "addQueueHandler",
            join: "joinHandler",
            abandon: "abandonHandler",
            callingAgent: "callingAgentHandler",
            stopCallingAgent: "stopCallingAgentHandler",
            connectAgent: "connectAgentHandler",
            disconnectAgent: "disconnectAgentHandler",
            queueData: "queueDataHandler",
            exitKeypress: "exitKeypressHandler",
            exitTimeout: "exitTimeoutHandler",
            exitLeaveEmpty: "exitLeaveEmptyHandler",
        };

        for (const [event, handler] of Object.entries(queueEventHandlers)) {
            if (typeof this[handler] === "function") {
                this.connection.on(event, this[handler]);
            }
        }
    };
}

export default QueueDispatcher;
