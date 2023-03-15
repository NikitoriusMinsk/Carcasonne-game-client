import styles from "@/styles/pages/Home.module.css";
import { type NextPage } from "next";
import Head from "next/head";
import { useEffect, useReducer, useRef, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { HubConnection } from "@microsoft/signalr/dist/esm/HubConnection";
import Image from "next/image";

type BoardTile = { id: string; rotation: number } | null;

const Home: NextPage = () => {
	const [connection, setConnection] = useState<HubConnection | null>(null);
	const [board, dispatch] = useReducer(boardReducer, new Array<BoardTile[]>(), () => {
		return Array.from(Array(72), () => new Array(72).fill(null));
	});
	const [heldTile, setHeldTile] = useState<string>();

	function boardReducer(
		state: Array<BoardTile[]>,
		action: {
			type: "place";
			position: { x: number; y: number };
			id: string;
			rotation: number;
		}
	) {
		const { position, type, rotation, id } = action;
		switch (type) {
			case "place":
				let _state = [...state];
				_state[position.x]![position.y] = { id, rotation };
				return _state;
			default:
				return state;
		}

		return state;
	}

	useEffect(() => {
		const _connection = new HubConnectionBuilder()
			.withUrl("https://localhost:7055/hubs/games")
			.build();

		_connection.on(
			"TilePlaced",
			(id: string, x: number, y: number, rotation: number) => {
				dispatch({ type: "place", position: { x, y }, id, rotation });
			}
		);
		_connection.on("TileDrawn", (id: string) => {
			setHeldTile(id);
		});

		_connection.start().catch((err) => console.error(err));
		setConnection(_connection);
		return () => {
			_connection.stop();
		};
	}, []);

	return (
		<>
			<Head>
				<title>Carcasonne</title>
				<link
					rel="icon"
					href="/favicon.ico"
				/>
			</Head>
			<main className={styles.main}>
				<Controls connection={connection} />
				<div className={styles.heldTile}>
					<Image
						src={`/images/tiles/${heldTile}.png`}
						fill
						alt=""
					/>
				</div>
				<div className={styles.board}>
					{board.map((row, rowIndex) => (
						<div
							key={`row_${rowIndex}`}
							className={styles.row}
						>
							{row.map((tile, colIndex) => (
								<div
									key={`tile_${rowIndex}:${colIndex}`}
									className={styles.tile}
									onClick={() =>
										connection?.send(
											"PlaceTile",
											heldTile,
											rowIndex,
											colIndex,
											0 // TODO: rotate tiles
										)
									}
								>
									{tile && (
										<Image
											src={`/images/tiles/${tile?.id}.png`}
											fill
											alt=""
										/>
									)}
								</div>
							))}
						</div>
					))}
				</div>
			</main>
		</>
	);
};

const Controls: React.FC<{ connection?: HubConnection | null }> = (props) => {
	const { connection } = props;

	return (
		<div className={styles.controls}>
			<button onClick={() => connection?.send("CreateRoom", "test", "Nik")}>
				create room
			</button>
			<button onClick={() => connection?.send("JoinRoom", "test", "Nik")}>
				join room
			</button>
			<button onClick={() => connection?.send("LeaveRoom", "test")}>
				leave room
			</button>
			<button onClick={() => connection?.send("DeleteRoom", "test")}>
				delete room
			</button>
			<button onClick={() => connection?.send("StartGame")}>start game</button>
		</div>
	);
};

export default Home;
