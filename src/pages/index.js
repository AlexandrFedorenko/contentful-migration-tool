import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Container, Typography, CircularProgress, Grid, Card, CardContent, IconButton, Alert } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";

export default function Home() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function loadSpaces() {
      try {
        const response = await fetch("/api/spaces");
        if (!response.ok) throw new Error("Spaces loading error");

        const data = await response.json();
        setSpaces(data.spaces || []);
      } catch (err) {
        console.error("❌ Spaces loading error:", err);
        setError("Failed to load the list of spacelists.");
      } finally {
        setLoading(false);
      }
    }
    loadSpaces();
  }, []);

  const handleSelectSpace = (id) => {
    router.push(`/space/${id}`);
  };

  return (
      <Container sx={{ mt: 5 }}>
        <Typography variant="h3" textAlign="center" fontWeight={500} gutterBottom>
          Select a space
        </Typography>

        {loading ? (
            <CircularProgress sx={{ display: "block", mx: "auto", mt: 4 }} />
        ) : error ? (
            <Alert severity="error">{error}</Alert>
        ) : (
            <Grid container spacing={3} justifyContent="center" sx={{ mt: 7, pb: 5 }}>
              {spaces.map((space) => (
                  <Grid item key={space.id} xs={12} sm={6} md={4} lg={3}>
                    <Card
                        sx={{
                          textAlign: "center",
                          p: 2,
                          cursor: "pointer",
                          transition: "0.3s",
                          "&:hover": { transform: "scale(1.05)" },
                        }}
                        onClick={() => handleSelectSpace(space.id)}
                    >
                      <IconButton sx={{ bgcolor: "primary.main", color: "white", mb: 1 }}>
                        <DashboardIcon fontSize="large" />
                      </IconButton>
                      <CardContent>
                        <Typography variant="h6" fontWeight={600}>
                          {space.name}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
              ))}
            </Grid>
        )}
      </Container>
  );
}
