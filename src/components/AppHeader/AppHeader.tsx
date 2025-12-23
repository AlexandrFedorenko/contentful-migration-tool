import React from "react";
import { AppBar, Toolbar } from "@mui/material";
import Link from "next/link";
import ArticleIcon from "@mui/icons-material/Article";
import styles from "./AppHeader.module.css";

const AppHeader = React.memo(function AppHeader() {
    return (
        <AppBar position="static" sx={{ p: 1 }}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link href="/" className={styles.logoWrapper} aria-label="Go to home page">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className={styles.logo}
                        width={120}
                        height={50}
                    />
                </Link>
                <Link href="/doc" className={styles.docLink}>
                    <ArticleIcon sx={{ fontSize: 32, color: "white" }} />
                    Documentation
                </Link>
            </Toolbar>
        </AppBar>
    );
});

export default AppHeader;
