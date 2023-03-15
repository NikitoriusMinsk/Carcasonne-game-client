import styles from "@/styles/pages/Home.module.css";
import { type NextPage } from "next";
import Head from "next/head";
import { useEffect, useReducer, useRef } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { HubConnection } from "@microsoft/signalr/dist/esm/HubConnection";
import Image from "next/image";

type BoardTile = { id: string; rotation: number } | null;

const Home: NextPage = () => {
	const connection = useRef<HubConnection | null>(null);
	const [board, dispatch] = useReducer(boardReducer, new Array<BoardTile[]>(), () => {
		return new Array(72).fill(new Array(72).fill(null));
	});

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
		connection.current = new HubConnectionBuilder()
			.withUrl("https://localhost:7055/hubs/games")
			.build();

		connection.current.on(
			"TilePlaced",
			(id: string, x: number, y: number, rotation: number) => {
				dispatch({ type: "place", position: { x, y }, id, rotation });
			}
		);

		connection.current.start().catch((err) => console.error(err));
		return () => {
			connection.current?.stop();
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
				<Controls connection={connection.current} />
				<div className={styles.board}>
					{board.map((row) => (
						<div className={styles.row}>
							{row.map((tile) => (
								<div className={styles.tile}>
									{tile && (
										<Image
											src={`/images/tiles/${tile?.id}`}
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
		</div>
	);
};

export default Home;
