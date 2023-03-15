import styles from "@/styles/pages/Home.module.css";
import { type NextPage } from "next";
import Head from "next/head";
import { MutableRefObject, useEffect, useReducer, useRef, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { HubConnection } from "@microsoft/signalr/dist/esm/HubConnection";
import Image from "next/image";

type BoardTile = { id: string; rotation: number } | null;

const Home: NextPage = () => {
	const connection = useRef<HubConnection | null>(null);
	const [board, dispatch] = useReducer(boardReducer, new Array<BoardTile[]>(), () => {
		return Array.from(Array(144), () => new Array(144).fill(null));
	});
	const [heldTile, setHeldTile] = useState<{ id: string | null; rotation: number }>({
		id: null,
		rotation: 0,
	});
	const [possiblePlacements, setPossiblePlacements] = useState<
		{ x: number; y: number }[]
	>([]);
	const [isFirstTurn, setIsFirstTurn] = useState(true);

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
	}

	function handleRotate() {
		if (heldTile.rotation === 3) {
			connection.current
				?.invoke("GetPossiblePlacements", heldTile.id, 0)
				.then((res) => {
					setPossiblePlacements(res);
					setHeldTile({ ...heldTile, rotation: 0 });
				});
		} else {
			connection.current
				?.invoke("GetPossiblePlacements", heldTile.id, heldTile.rotation + 1)
				.then((res) => {
					setPossiblePlacements(res);
					setHeldTile({ ...heldTile, rotation: heldTile.rotation + 1 });
				});
		}
	}

	function handlePlaceTile(x: number, y: number) {
		connection.current?.send("PlaceTile", heldTile.id, x, y, heldTile.rotation);
		setPossiblePlacements([]);
		if (isFirstTurn) setIsFirstTurn(false);
		setHeldTile({ id: null, rotation: 0 });
	}

	useEffect(() => {
		connection.current = new HubConnectionBuilder()
			.withUrl("https://localhost:7055/hubs/games")
			.build();

		connection.current.on(
			"TilePlaced",
			(id: string, x: number, y: number, rotation: number) => {
				dispatch({ type: "place", position: { x, y }, id, rotation });
				setIsFirstTurn(false);
			}
		);
		connection.current.on("TileDrawn", (id: string) => {
			connection.current?.invoke("GetPossiblePlacements", id, 0).then((res) => {
				setHeldTile({ id, rotation: 0 });
				setPossiblePlacements(res);
			});
		});

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
				<Controls connection={connection} />
				<div className={styles.heldTile}>
					<Image
						src={`/images/tiles/${heldTile.id}.png`}
						className={styles[`rotate${90 * heldTile.rotation}`]}
						height={90}
						width={90}
						alt=""
					/>
					<button
						onClick={handleRotate}
						disabled={heldTile.id === null}
					>
						Rotate
					</button>
				</div>
				<div className={styles.board}>
					{board.map((row, rowIndex) => (
						<div
							key={`row_${rowIndex}`}
							className={styles.row}
						>
							{row.map((tile, colIndex) => {
								const isPossible =
									possiblePlacements.some(
										(place) =>
											place.x === rowIndex && place.y === colIndex
									) || isFirstTurn;
								return (
									<div
										key={`tile_${rowIndex}:${colIndex}`}
										//prettier-ignore
										className={`${styles.tile} ${isPossible ? styles.active : ""} ${styles[`rotate${90 * tile?.rotation!}`]}`}
										onClick={() =>
											handlePlaceTile(rowIndex, colIndex)
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
								);
							})}
						</div>
					))}
				</div>
			</main>
		</>
	);
};

const Controls: React.FC<{ connection: MutableRefObject<HubConnection | null> }> = (
	props
) => {
	const { connection } = props;

	return (
		<div className={styles.controls}>
			<button onClick={() => connection.current?.send("CreateRoom", "test", "Nik")}>
				create room
			</button>
			<button onClick={() => connection.current?.send("JoinRoom", "test", "Nik")}>
				join room
			</button>
			<button onClick={() => connection.current?.send("LeaveRoom", "test")}>
				leave room
			</button>
			<button onClick={() => connection.current?.send("DeleteRoom", "test")}>
				delete room
			</button>
			<button onClick={() => connection.current?.send("StartGame")}>
				start game
			</button>
		</div>
	);
};

export default Home;
