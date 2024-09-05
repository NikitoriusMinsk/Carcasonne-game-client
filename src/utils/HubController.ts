import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

type onTilePlacedHandler = (id: string, x: number, y: number, rotation: number) => void;
type onTileDrawnHandler = (id: string) => void;
type onPlayerLeftRoomHandler = (players: string[]) => void;
type onRoomsUpdatedHandler = (rooms: { name: string; players: string[] }[]) => void;

export default class HubController {
	private connection: HubConnection;

	constructor(url: string) {
		this.connection = new HubConnectionBuilder()
			.withUrl(url)
			.configureLogging(LogLevel.Debug)
			.withAutomaticReconnect()
			.build();

		this.connection.start();
	}

	public set onTilePlaced(handler: onTilePlacedHandler) {
		this.connection.on("TilePlaced", handler);
	}

	public set onTileDrawn(handler: onTileDrawnHandler) {
		this.connection.on("TileDrawn", handler);
	}

	public set onPlayerLeftRoom(handler: onPlayerLeftRoomHandler) {
		this.connection.on("PlayerLeftRoom", handler);
	}

	public set onRoomsUpdated(handler: onRoomsUpdatedHandler) {
		this.connection.on("RoomsUpdated", handler);
	}

	public stop() {
		void this.connection.stop();
	}

	public async getPossiblePlacements(tileId: string, rotation: number) {
		return (await this.connection.invoke(
			"GetPossiblePlacements",
			tileId,
			rotation
		)) as { x: number; y: number }[];
	}

	public async placeTile(tileId: string, x: number, y: number, rotation: number) {
		await this.connection.send("PlaceTile", tileId, x, y, rotation);
	}

	public async createRoom(roomName: string, nickname: string) {
		await this.connection.send("CreateRoom", roomName, nickname);
	}

	public async joinRoom(roomName: string, nickname: string) {
		await this.connection.send("JoinRoom", roomName, nickname);
	}

	public async leaveRoom(roomName: string) {
		await this.connection.send("LeaveRoom", roomName);
	}

	public async deleteRoom(roomName: string) {
		await this.connection.send("DeleteRoom", roomName);
	}

	public async startGame() {
		await this.connection.send("StartGame");
	}

	public async getRoomList() {
		return (await this.connection.invoke("GetRoomList")) as string[];
	}
}
