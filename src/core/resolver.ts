import { getContext } from "./context";

const MASTER_PREFIX = ["Admin_", "Setup_", "System_"];

export function resolveDb(procedure: string): string {
    const cfg = getContext();

    const isMaster = MASTER_PREFIX.some(p => procedure.startsWith(p));

    return isMaster ? cfg.masterDb : cfg.clientDb;
}
