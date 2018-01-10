import * as escape from "escape-html";
import * as http from "http";
import * as socketIo from "socket.io";
import * as logger from "winston";

interface IPlayer {
    id: string;
    name: string;
    title: string;
}

export class SocketIOManager {
    private io: SocketIO.Server;
    private turn: boolean;
    private user: string;

    constructor(private server: http.Server) {
        this.io = socketIo.listen(this.server);
        this.turn = !!Math.floor(Math.random() * 2); 
        this.user = "";
    }

    public start(): void {
        this.io.on("connection", (socket) => {
            logger.info(`User ${socket.id} connected. Name: ${socket.handshake.query.name}, Title: ${socket.handshake.query.title}`);

            socket.emit('turn', this.turn); //посылаем первый или второй ход
            this.turn = !this.turn; //меняем статус хода для будущих поколений))

            if(this.user=="") //если у нас нет пары для юзера
                this.user = socket.id; //запоминаем его
            
            else { //если нашли пару
                socket.to(this.user).emit('start-battle', socket.id); //посылаем первому юзеру айдишник текущего юзера
                socket.emit('start-battle', this.user); //а текущему юзеру посылаем айдишник старого
                //оба начинают битву
                this.user = ""; //готовы опять искать пару
                //!сделать, чтобы не заходило в уже начатую битву. сделать состояние и спрашивать о нём например
            }

            socket.on("disconnect", (data: string) => {
                logger.info(`User ${socket.id} disconnected.`);
                socket.broadcast.emit("disconnected", {
                    id: socket.id,
                });
            });

            socket.on("turn-switch", (opponent: string) => {
                socket.to(opponent).emit("turn-switch");
                console.log("Turn switched");
            });
        });
    }

    public get currentPlayers(): Array<IPlayer> {
        let players = new Array<IPlayer>();
        let sockets = this.io.sockets.sockets;

        for (let socketId of Object.keys(sockets)) {
            let socket = sockets[socketId];

            players.push({
                id: socket.id,
                name: socket.handshake.query.name,
                title: socket.handshake.query.title,
            });
        }

        return players;
    }
}
