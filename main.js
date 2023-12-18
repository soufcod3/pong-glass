const uuid = require('uuid');
const http = require('http')
const express = require('express')
const app = express()

app.use(express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})


app.listen(9091, () => console.log('Listening on http port 9091'))
const websocketServer = require('websocket').server
const httpServer = http.createServer()
httpServer.listen(9090, () => console.log("Listening on 9090"))

const wsServer = new websocketServer({
    'httpServer': httpServer
})

// clients hashmap
const clients = {}
const gameStates = {}

wsServer.on('request', request => {
    // first contact between client and server
    const connection = request.accept(null, request.origin)

    connection.on('open', () => console.log('opened !'))
    connection.on('close', () => console.log('closed!'))
    connection.on('message', message => {
        const result = JSON.parse(message.utf8Data)
        // message treatment
        console.log('RESULT', result)

        // CREATE method
        if (result.method === 'CREATE') {
            const clientId = result.clientId

            const gameId = uuid.v4()
            gameStates[gameId] = {
                id: gameId,
                leftX: result.leftX,
                leftY: result.leftY,
                rightX: result.rightX,
                rightY: result.rightY,
                clients: [clientId]
            }

            const payload = {
                method: 'CREATE',
                gameState: gameStates[gameId]
            }

            const con = clients[clientId].connection
            con.send(JSON.stringify(payload))
        }

        // JOIN method
        if (result.method === 'JOIN') {
            const clientId = result.clientId
            const gameId = result.gameId

            const game = gameStates[gameId]
        
            if (game.clients.length > 2) {
                // sorry max players reach
                return
            }
            game.clients.push(clientId)

            const payload = {
                method: 'JOIN',
                gameState: game
            }

            game.clients.forEach(clientId => {
                clients[clientId].connection.send(JSON.stringify(payload))
            });

            console.log('GAME', game)
        }


        // ACTION method
        if (result.method === 'ACTION') {
            const gameState = result.gameState
            gameStates[gameState.id] = gameState

            const payload = {
                method: 'ACTION',
                gameState: gameStates[gameState.id]
            }

            gameState.clients.forEach(clientId => {
                clients[clientId].connection.send(JSON.stringify(payload))
            });

            console.log('sending game state')
        }

    })

    // generate a new clientId
    const clientId = uuid.v4()
    clients[clientId] = {
        connection: connection
    }

    const payload = {
        method: 'CONNECT',
        clientId: clientId
    }

    // send back the client connect
    connection.send(JSON.stringify(payload))
})