"use client";

import {AppBar, Link, Toolbar} from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/router";
import ArticleIcon from "@mui/icons-material/Backup";
import styles from "./AppHeader.module.css";

export default function AppHeader() {
    const router = useRouter();

    return (
        <AppBar position="static" sx={{ p: 1 }}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

                <Image
                    src="/logo.png"
                    alt="Logo"
                    width={120}
                    height={50}
                    className={styles.logo}
                    onClick={() => router.push("/")}
                    style={{ cursor: "pointer" }}
                />

                <Link
                    href="/doc"
                    sx={{
                        position: "absolute",
                        right: 20,
                        color: "white",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "15px"
                    }}
                >
                    <ArticleIcon sx={{ cursor: "pointer", fontSize: 32, color: "white" }} />
                    Documentation
                </Link>

            </Toolbar>
        </AppBar>
    );
}
