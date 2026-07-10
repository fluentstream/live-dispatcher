// This is the master class for handling all live events for calls, queues and agents.

import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";

class LiveDispatcher {

    constructor(options) {

        // Connection + subscription state
        this.tenant = null;
        this.extension = null;
        this.config = null;
        this.room = null;
        this.rooms = [];
        this.eventScope = null;
        this.connection = null;
        this.initHandler = null;
        this.apikey = null;
        this.authenticationAttempts = 0;
        this.authenticationMaxAttempts = 0;
        this.authenticationScheme = null;
        this.connectEventHandler = null;
        this.reconnectEventHandler = null;
        this.reconnectingEventHandler = null;
        this.reconnectAttemptEventHandler = null;
        this.reconnectErrorEventHandler = null;
        this.reconnectFailedEventHandler = null;

        this.pongEventHandler = null;
        this.pingCount = 0;
        this.pingInterval = 10 * 1000;
        this.pingTimeoutTime = 20 * 1000;
        this.pingTimeoutHandle = null;
        this.pingLastLatency = 0;
        this.pingLastUpdate = null;

        // Merge the caller's options in. Anything passed (including the
        // dispatcher-specific event handlers) is copied onto the instance.
        Object.assign(this, options);
    }

    run() {

        this.connect();
        this.listen();
    }

    connect() {

        // Lets make sure we have a config object and that socket info is set
        if (!this.config) {
            throw new Error("Could not find configuration settings.");
        }

        // And check the socket
        if (!this.config.socket) {
            throw new Error("Could not find socket configuration.");
        }

        const connectUrl = `${this.config.socket.url}:${this.config.socket.socket}${this.namespace}`;

        // Lets build the connection options here
        const options = {
            secure: this.config.socket.secure,
            reconnection: true,
            reconnectionAttempts: this.config.socket.connectAttempts,
            reconnectionDelay: this.config.socket.connectDelay,
            transports: this.config.socket.transport,
            rememberUpgrade: true,
        };

        // Let see if we are using the api key to connect
        if (this.apikey) {
            options.query = { apikey: this.apikey };
            this.authenticationScheme = "api";
        } else {
            this.authenticationScheme = "session";
        }

        // Lets attempt to connect here
        try {
            this.connection = io(connectUrl, options);
        } catch (error) {
            throw new Error("Could not connect to server please check the configuration");
        }

        // We can only subscribe when the connection is ready. Add the listener here.
        this.connection.on("connectionReady", (event) => {

            // If we have multiple rooms (array) subscribe to them
            if (this.rooms) {

                if (Array.isArray(this.rooms)) {
                    this.rooms.forEach((room) => this.subscribe(room));
                } else {
                    this.subscribe(this.rooms);
                }
            }

            // Lets call the connectEventHandler to broadcast we are connected
            if (typeof this.connectEventHandler === "function") {
                this.connectEventHandler(event);
            }

            // Lets call getState to get initial state
            if (typeof this.getState === "function") {
                this.getState();
            }
        });

        // Lets assign the rest of the listeners
        const liveEventHandlers = {
            disconnect: "disconnectHandler",
            reconnect: "reconnectHandler",
            reconnecting: "reconnectingHandler",
            reconnect_attempt: "reconnectAttemptHandler",
            reconnect_error: "reconnectErrorHandler",
            reconnect_failed: "reconnectFailedHandler",
        };

        for (const [event, handler] of Object.entries(liveEventHandlers)) {
            if (typeof this[handler] === "function") {
                this.connection.on(event, this[handler]);
            }
        }

        // Lets set up an error listener
        this.connection.on("error", () => {

            if (this.authenticationScheme === "session" &&
                this.authenticationAttempts > this.authenticationMaxAttempts) {

                throw new Error("Could not connect to the server");
            }
        });

        // Lets start listening for the server to pong us
        this.connection.on("drop", (payload) => this.pong(payload));
    }

    close() {

        this.connection.close();
    }

    emit(event, payload) {

        this.connection.emit(event, payload);
    }

    pong(payload) {

        if (this.pingTimeoutHandle) {
            clearTimeout(this.pingTimeoutHandle);
        }

        const startDate = new Date(payload.date);
        const start = startDate.getTime();

        const nowDate = new Date();
        const now = nowDate.getTime();

        this.pingLastLatency = now - start;
        this.pingLastUpdate = nowDate;

        const emitData = {
            startDate,
            nowDate,
            latency: this.pingLastLatency,
        };

        if (typeof this.pongEventHandler === "function") {
            this.pongEventHandler(emitData);
        }
    }

    playPingPong() {

        // Clear the timeout
        if (this.pingTimeoutHandle) {
            clearTimeout(this.pingTimeoutHandle);
        }

        // Set timeout and emit back to server
        setTimeout(() => {
            console.log("Playing Ping Pong");

            const date = new Date();

            this.pingTimeoutHandle = setTimeout(() => this.pingTimeout(), this.pingTimeoutTime);

            this.emit("drip", { date });

            this.playPingPong();
        }, this.pingInterval);
    }

    pingTimeout() {

        if (typeof this.pingTimeoutHandler === "function") {
            this.pingTimeoutHandler();
        }
    }

    // Gets state of object passed in from server
    getState() {

        this.emit(this.initEvent, this.tenant);
    }

    subscribe(room) {

        // Check for tenant
        if (!this.tenant) {
            console.log("[Live Dispatcher] No tenant assigned: ", this.tenant);
            throw new Error("Please include a valid tenant name");
        }

        // Check for room
        if (!room) {
            console.log("[Live Dispatcher] Attempting to subscribe to invalid room: ", room);
            throw new Error("Attempting to subscribe to invalid room");
        }

        console.log("[Live Dispatcher] Subscribing to room: ", room);

        if (typeof this.initHandler === "function") {

            // If we have an init handler, let's pass that to our emit
            return this.emit("subscribe", room, () => this.initHandler());
        }

        // If not, just emit the subscribe to room
        return this.emit("subscribe", room);
    }

    unsubscribe(room) {

        if (!room) {
            console.log("[Live Dispatcher] Attempting to unsubscribe from invalid room: ", room);
            throw new Error("Attempting to unsubscribe from invalid room");
        }

        // Lets find the index of the room
        // we want to remove (in this.rooms) and remove from array
        const i = this.rooms.findIndex((item) => item === room);
        this.rooms.splice(i, 1);

        this.emit("unsubscribe", room);
    }

    reconnection() {

        this.keepAliveConnectAttempts++;

        if (this.keepAliveConnectAttempts !== this.keepAliveMaxAttempts) {

            delete this.connection;
            return this.run();
        }
    }

}

export default LiveDispatcher;
