import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname } from "path";
import { WebSocketServer, WebSocket } from "ws";


const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
};

const httpServer = createServer(async (req, res) => {
  const url  = req.url === "/" ? "/index.html" : req.url;
  const ext  = extname(url);
  const mime = MIME_TYPES[ext] ?? "text/plain";

  try {
    const file = await readFile(`./public${url}`);
    res.writeHead(200, { "Content-Type": mime });
    res.end(file);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

const wss = new WebSocketServer({server: httpServer })

const users = new Map();

function broadcastUSers(){
  const payload = JSON.stringify({
    type: "users",
    users: Array.from(users.values()),

  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(payload)
  })
}



// todo 1: maak een websocket server aan
// Koppel de Websocket server aan de httpServer zodat ze allebei
// op dezelfde poort draaien.

wss.on("connection", (ws) => {
  console.log(`${wss.clients.size} clients verbonden`)
  ws.username = null

  ws.on("message", (data) => {
    const parsed = JSON.parse(data.toString())
    console.log(parsed)
    ws.username = parsed.sender
    if (parsed.type === "join"){

      
      //hier komt code voor broadcast
      users.set(ws, parsed.sender)
      broadcastUSers()
      console.log(`joined ${parsed.sender}`)
      
    } else if (parsed.type === "message"){
      const payload = JSON.stringify(parsed)

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload)
        }
      })

    }
  })
  ws.on("close", () => {
    users.delete(ws)
    broadcastUSers()
    
    console.log(`${ws.username} disconnected`)
    
  })


  ws.on("error", (error)=> {
    console.error(error.message)
  })
  
})

// todo 2: op nieuwe verbindingen reageren
// luister naar het connection event op wss,
// log naar de console wanneer iemand verbind.

  // todo 3: ontvang berichten
  // luister naar het message event op ws.
  // doe wat er nodig is om berichten in het juiste formaat te ontvangen


    // todo 4: broadcast messages naar alle clients
    //
    // als parsed.type === "message":
    // Stuur het bericht door naar elke client (wss.clients)
    // ready state moet WebSocket.OPEN zijn.
    


  // todo 5: reageer op een verbroken verbinding
  //
  // Luister naar het close event op ws.
  // log naar de console wanneer iemand de verbinding verbreekt.


  // todo 6: error handling
  //
  // luister naar het error event op ws.
  // zonder deze handler crasht node.js wanneer er een verbindingsfout is.



// optioneel — gebruikerslijst
//
// Stap 1: maak een Map aan: const users = new Map()
//         Sleutel = ws object, waarde = gebruikersnaam
//
// Stap 2: schrijf een broadcastUsers() functie die dit stuurt
//         naar iedereen die verbonden is:
//           { type: "users", users: ["jimmie", "hendrix"] }
//         Gebruik Array.from(users.values()) voor de namen.
//
// Stap 3: bij type join: users.set(ws, sender) + broadcastUsers()
//
// Stap 4: bij close: users.delete(ws) + broadcastUsers()

///belangrijk, VERANDER PORT

const PORT = process.env.PORT || 3000

httpServer.listen(PORT, () => {
  console.log("http://localhost:3000");
});
