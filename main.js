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
let player1 = null;
let player2 = null;
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
      const player1Id = result.player1;

      const gameId = uuid.v4();

      gameStates[gameId] = {
        ...result.gameState,
        id: gameId,
        players: [player1Id],
      };

      const payload = {
        method: "CREATE",
        gameState: gameStates[gameId],
      };

      console.log('player1', player1)
      console.log('player2', player2)
      player1.connection.send(JSON.stringify(payload));
    }

    // JOIN method
    if (result.method === "JOIN") {
      const player2Id = result.playerId;
      const gameId = result.gameState.id;
      const gameState = gameStates[gameId];

      if (gameState.players.length > 2) {
        // sorry max players reach
        return;
      }

      gameState.players.push(player2Id);

      const payload = {
        method: "JOIN",
        gameState: gameState,
      };

      player1.connection.send(JSON.stringify(payload))
      player2.connection.send(JSON.stringify(payload))
    }

    if (result.method === "PADDLE_LEFT") {
      const gameState = result.gameState;
      gameStates[gameState.id] = gameState;

      const payload = {
        method: "PADDLE_LEFT",
        gameState: gameStates[gameState.id],
      };

      // only send to player2
      player2.connection.send(JSON.stringify(payload));
    }

    // GAME_STATE
    if (result.method === "GAME_STATE") {
        const gameState = result.gameState;
        gameStates[gameState.id] = gameState;

        const payload = {
          method: "GAME_STATE",
          gameState: gameStates[gameState.id],
        };

        player1.connection.send(JSON.stringify(payload))
        player2.connection.send(JSON.stringify(payload))
    }

    // BALL method
    if (result.method === "BALL") {
      const gameId = result.gameId;
      const gameState = gameStates[gameId];
      const position = result.position;

      const payload = {
        method: "BALL",
        position,
      };

      if (gameState) {
        gameState.clients.forEach((clientId) => {
          connections[clientId].connection.send(JSON.stringify(payload));
        });
      }
    }
  });

  // generate a new playerId
  const playerId = uuid.v4();

  if (!player1) {
    player1 = { id: playerId, connection }
    player2 = null
  } else if (player1 && !player2) {
    player2 = { id: playerId, connection }
  } else if (player1 && player2) {
    player1 = { id: playerId, connection }
    player2 = null
  }

  const payload = {
    method: "CONNECT",
    playerId: playerId,
  };

  console.log('player1', player1)
  console.log('player2', player2)

  // send back the client connect
  connection.send(JSON.stringify(payload));
});

// problèmes de latence peuvent arriver quand le serveur est hébergé ailleurs (chemins parcourus par les paquets sont plus longs)
// une idée est de retirer les infos inutiles dans le paquets (ex. les brackets du json)
// en utilisant seulement des bits ou octets (pas compris) : ce qu'on veut c'est le y du paddle left, le y du paddle right et le x et y de la balle
// aussi il faudra prendre en compte les décalages dû à la latence : il suffit d'un pixel de décalé dans la position de la balle pour fausser le jeu
// le joueur 1 peut penser avoir gagner alors que c'est le joueur 2 qui a gagné
// comment gérer ça ?
