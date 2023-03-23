import { createContext } from "react";
import type HubController from "./HubController";

export default createContext<HubController | null>(null);
