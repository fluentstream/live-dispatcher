import LiveDispatcher from "./liveDispatcher.js";

class AgentDispatcher extends LiveDispatcher {
    constructor(options) {
        super(options);
        this.initEvent = "getAgents";
        this.namespace = "/liveAgents";
    }

    listen = () => {

        const agentEventHandlers = {
            agentCalled: "agentCalledHandler",
            agentConnect: "agentConnectHandler",
            agentComplete: "agentCompleteHandler",
            addAgent: "addAgentHandler",
            agentRingNoAnswer: "agentRingNoAnswerHandler",
            updateAgent: "updateAgentHandler",
            agentData: "agentDataHandler",
        };

        for (const [event, handler] of Object.entries(agentEventHandlers)) {
            if (typeof this[handler] === "function") {
                this.connection.on(event, this[handler]);
            }
        }
    };
}

export default AgentDispatcher;
