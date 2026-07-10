import LiveDispatcher from "./liveDispatcher.js";

class AutoAttendantDispatcher extends LiveDispatcher {
    constructor(options) {
        super(options);
        this.initEvent = "getCalls";
        this.namespace = "/autoattendant";
    }

    listen = () => {

        const autoAttendantEventHandlers = {
            keypress: "keypressHandler",
        };

        for (const [event, handler] of Object.entries(autoAttendantEventHandlers)) {
            if (typeof this[handler] === "function") {
                this.connection.on(event, this[handler]);
            }
        }
    };
}

export default AutoAttendantDispatcher;
