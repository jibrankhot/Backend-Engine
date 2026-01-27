import dotenv from "dotenv";
dotenv.config();

type DbType = "sqlserver" | "supabase";
type ProjectType = "ecom" | "school";

export const ENV = {
    server: {
        env: process.env.NODE_ENV || "development",
        port: Number(process.env.PORT || 5000),
    },

    project: (process.env.PROJECT || "ecom") as ProjectType,

    db: {
        primary: (process.env.DB_PRIMARY || "sqlserver") as DbType,

        sqlserver: {
            host: process.env.DB_HOST || "",
            port: Number(process.env.DB_PORT || 1433),
            instance: process.env.DB_INSTANCE || "",
            name: process.env.DB_NAME || "",
            user: process.env.DB_USER || "",
            password: process.env.DB_PASSWORD || "",
        },

        supabase: {
            url: process.env.SUPABASE_URL || "",
            serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        },
    },
};
