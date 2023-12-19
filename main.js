const uuid = require("uuid");
const http = require("http");
const express = require("express");
const app = express();

app.use(express.static(__dirname));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.listen(9091, () => console.log("Listening on http port 9091"));
const websocketServer = require("websocket").server;
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening on 9090"));

const wsServer = new websocketServer({
  httpServer: httpServer,
});

// clients hashmap
const clients = {};
const gameStates = {};

wsServer.on("request", (request) => {
  // first contact between client and server
  const connection = request.accept(null, request.origin);

  connection.on("open", () => console.log("opened !"));
  connection.on("close", () => console.log("closed!"));
  connection.on("message", (message) => {
    const result = JSON.parse(message.utf8Data);
    // message treatment
    console.log("RESULT", result);

    // CREATE method
    if (result.method === "CREATE") {
      const clientId = result.clientId;

      const gameId = uuid.v4();
      gameStates[gameId] = {
        ...result.gameState,
        id: gameId,
        clients: [clientId],
      };

      const payload = {
        method: "CREATE",
        gameState: gameStates[gameId],
      };

      console.log('clients', clients, clientId)
      const con = clients[clientId].connection;
      con.send(JSON.stringify(payload));
    }

    // JOIN method
    if (result.method === "JOIN") {
      const clientId = result.clientId;
      const gameId = result.gameState.id;
      console.log("GAME ID", gameId);
      const gameState = gameStates[gameId];

      if (gameState.clients.length > 2) {
        // sorry max players reach
        return;
      }
      gameState.clients.push(clientId);

      const payload = {
        method: "JOIN",
        gameState: gameState,
      };

      gameState.clients.forEach((clientId) => {
        clients[clientId].connection.send(JSON.stringify(payload));
      });
    }

    // ACTION method
    if (result.method === "ACTION") {
      console.log('ACTION !!!!', result.gameState)
      const gameState = result.gameState;
      gameStates[gameState.id] = gameState;
      
      const payload = {
        method: "ACTION",
        gameState: gameStates[gameState.id],
      };

      gameState.clients.forEach((clientId) => {
        clients[clientId].connection.send(JSON.stringify(payload));
      });
      console.log("sending game state to", gameState.clients);

    }

    // BALL method
    if (result.method === "BALL") {
        
      const gameId = result.gameId
      const gameState = gameStates[gameId]
      const position = result.position;

      const payload = {
        method: "BALL",
        position
      };

      if (gameState) {
        gameState.clients.forEach((clientId) => {
            clients[clientId].connection.send(JSON.stringify(payload));
          });
      }
    }
  });

  // generate a new clientId
  const clientId = uuid.v4();
  clients[clientId] = {
    connection: connection,
  };

  const payload = {
    method: "CONNECT",
    clientId: clientId,
  };

  console.log('NEW CONNECTION')

  // send back the client connect
  connection.send(JSON.stringify(payload));
});

// problèmes de latence peuvent arriver quand le serveur est hébergé ailleurs (chemins parcourus par les paquets sont plus longs)
// une idée est de retirer les infos inutiles dans le paquets (ex. les brackets du json)
// en utilisant seulement des bits ou octets (pas compris) : ce qu'on veut c'est le y du paddle left, le y du paddle right et le x et y de la balle
// aussi il faudra prendre en compte les décalages dû à la latence : il suffit d'un pixel de décalé dans la position de la balle pour fausser le jeu
// le joueur 1 peut penser avoir gagner alors que c'est le joueur 2 qui a gagné
// comment gérer ça ?
