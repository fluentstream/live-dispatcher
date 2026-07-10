// Connection configuration for the live event system.
// Swap the exported value for one of the presets below when targeting a
// different environment.

const config = {
  // Set these once for testing. The examples read tenant/apikey from here so
  // you don't have to edit each page.
  tenant: "[example tenant name]",
  apikey: "[example API key]",
  socket: {
    url: "https://live.fluentcloud.com",
    socket: 443,
    secure: true,
    transport: ["websocket"],
  },
  ajax: {
    apiNamespace: {
      core: { url: "https://my.fluentcloud.com/api/v1/core/" },
      call: { url: "https://my.fluentcloud.com/api/v1/call/" },
    },
  },
};

// Local development preset — connects through the dev server's /socket.io
// proxy (see server.js) so the browser stays same-origin and avoids CORS.
// Match the port to however you launched `npm start` (default 3000).
// const config = {
//   socket: {
//     url: "http://localhost",
//     socket: 3000,
//     secure: false,
//     transport: ["websocket"],
//     connectAttempts: 5,
//     connectDelay: 5000,
//   },
//   ajax: {
//     apiNamespace: {
//       core: { url: "http://localhost/api/v1/core/" },
//       call: { url: "http://localhost/api/v1/call/" },
//     },
//   },
// };

// Beta preset:
// const config = {
//   socket: {
//     url: "https://beta.fluentcloud.com",
//     socket: 443,
//     secure: true,
//     transport: ["websocket"],
//     connectAttempts: 5,
//     connectDelay: 5000,
//   },
//   ajax: {
//     apiNamespace: {
//       core: { url: "https://beta.fluentcloud.com/api/v1/core/" },
//       call: { url: "https://beta.fluentcloud.com/api/v1/call/" },
//     },
//   },
// };

export default config;
