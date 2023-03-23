import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import AppContext from "@/utils/AppContext";
import { api } from "@/utils/api";
import "@/styles/globals.css";
import HubController from "@/utils/HubController";
import { env } from "@/env.mjs";
import { useEffect, useState } from "react";

const MyApp: AppType<{ session: Session | null }> = ({
	Component,
	pageProps: { session, ...pageProps },
}) => {
	const [connection, setConnection] = useState<HubController | null>(null);

	useEffect(() => {
		setConnection(new HubController(env.NEXT_PUBLIC_HUB_ADRESS));

		return () => {
			connection?.stop();
		};
	}, []);

	return (
		<SessionProvider session={session}>
			<AppContext.Provider value={connection}>
				<Component {...pageProps} />
			</AppContext.Provider>
		</SessionProvider>
	);
};

export default api.withTRPC(MyApp);
