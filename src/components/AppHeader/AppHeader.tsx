"use client";

import React from "react";
import { AppBar, Link, Toolbar } from "@mui/material";
import { useRouter } from "next/router";
import ArticleIcon from "@mui/icons-material/Backup";
import styles from "./AppHeader.module.css";

function AppHeader() {
    const router = useRouter();

    const handleLogoClick = () => {
        router.push("/");
    };

    const linkStyles = {
        color: "white",
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: "10px",
    };

    return (
        <AppBar position="static" sx={{ p: 1 }}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className={styles.logoWrapper} onClick={handleLogoClick}>
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className={styles.logo}
                        width={120}
                        height={50}
                    />
                </div>
                <Link href="/doc" sx={linkStyles}>
                    <ArticleIcon sx={{ fontSize: 32, color: "white" }} />
                    Documentation
                </Link>
            </Toolbar>
        </AppBar>
    );
}

export default AppHeader;
