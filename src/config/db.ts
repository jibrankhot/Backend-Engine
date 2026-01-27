import { ENV } from "./env";

export const SQL_CONFIG = {
    server: ENV.db.sqlserver.host,
    port: ENV.db.sqlserver.port,
    user: ENV.db.sqlserver.user,
    password: ENV.db.sqlserver.password,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};
