import styles from "@/styles/pages/Home.module.css";
import { type NextPage } from "next";
import Head from "next/head";
import { useContext, useEffect, useReducer, useState } from "react";
import Image from "next/image";
import AppContext from "@/utils/AppContext";

type BoardTile = { id: string; rotation: number } | null;

const GamePage: NextPage = () => {
	const connection = useContext(AppContext);
	const [board, dispatch] = useReducer(boardReducer, new Array<BoardTile[]>(), () => {
		return Array.from(Array(144), () => new Array(144).fill(null));
	});
	const [heldTile, setHeldTile] = useState<{ id: string; rotation: number }>({
		id: "",
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
				const _state = [...state];
				_state[position.x]![position.y] = { id, rotation };
				return _state;
			default:
				return state;
		}
	}

	function handleRotate() {
		if (heldTile.rotation === 3) {
			connection?.getPossiblePlacements(heldTile.id, 0).then((res) => {
				setPossiblePlacements(res);
				setHeldTile({ ...heldTile, rotation: 0 });
			});
		} else {
			connection
				?.getPossiblePlacements(heldTile.id, heldTile.rotation + 1)
				.then((res) => {
					setPossiblePlacements(res);
					setHeldTile({ ...heldTile, rotation: heldTile.rotation + 1 });
				});
		}
	}

	function handlePlaceTile(x: number, y: number) {
		connection?.placeTile(heldTile.id, x, y, heldTile.rotation);
		setPossiblePlacements([]);
		if (isFirstTurn) setIsFirstTurn(false);
		setHeldTile({ id: "", rotation: 0 });
	}

	useEffect(() => {
		if (connection) {
			connection.onTilePlaced = (
				id: string,
				x: number,
				y: number,
				rotation: number
			) => {
				dispatch({ type: "place", position: { x, y }, id, rotation });
				setIsFirstTurn(false);
			};

			connection.onTileDrawn = (id: string) => {
				console.log(`Tile drawn ${id}`)
				connection.getPossiblePlacements(id, 0).then((res) => {
					setHeldTile({ id, rotation: 0 });
					setPossiblePlacements(res);
				});
			};
		}
	}, [connection]);

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
				<Controls />
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

const Controls: React.FC = () => {
	const connection = useContext(AppContext);

	return (
		<div className={styles.controls}>
			<button onClick={() => connection?.createRoom("test", "Nik")}>
				create room
			</button>
			<button onClick={() => connection?.joinRoom("test", "Nik")}>join room</button>
			<button onClick={() => connection?.leaveRoom("test")}>leave room</button>
			<button onClick={() => connection?.deleteRoom("test")}>delete room</button>
			<button onClick={() => connection?.startGame()}>start game</button>
		</div>
	);
};

export default GamePage;
