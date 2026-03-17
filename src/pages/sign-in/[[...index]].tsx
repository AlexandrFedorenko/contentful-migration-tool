import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function Page() {
    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 80px)" }}>
            <SignIn appearance={{ baseTheme: dark }} />
        </div>
    );
}
