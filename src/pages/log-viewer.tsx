import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  CircularProgress, 
  Alert,
  Button,
  Chip
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface LogData {
  errors?: Array<{
    type: string;
    message: string;
    details?: any;
    timestamp?: string;
  }>;
  warnings?: Array<{
    type: string;
    message: string;
    details?: any;
    timestamp?: string;
  }>;
  importedEntities?: {
    contentTypes: number;
    entries: number;
    assets: number;
    locales: number;
  };
}

export default function LogViewer() {
  const router = useRouter();
  const { fileName } = router.query;
  const [logData, setLogData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState<string | null>(null);

  useEffect(() => {
    if (fileName && typeof fileName === 'string') {
      loadLogFile(fileName);
    }
  }, [fileName]);

  const loadLogFile = async (file: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/log-file?fileName=${encodeURIComponent(file)}`);
      const data = await response.json();
      
      if (data.success && data.content) {
        setRawContent(data.content);
        try {
          const parsed = JSON.parse(data.content);
          setLogData(parsed);
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          setError('Invalid JSON format in log file');
        }
      } else {
        setError(data.error || 'Failed to load log file');
      }
    } catch (fetchError) {
      console.error('Error fetching log file:', fetchError);
      setError('Failed to fetch log file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (rawContent) {
      const blob = new Blob([rawContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `log-${fileName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleRefresh = () => {
    if (fileName && typeof fileName === 'string') {
      loadLogFile(fileName);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            Log File Viewer
          </Typography>
          <Chip label={fileName} color="primary" />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            disabled={!rawContent}
          >
            Download
          </Button>
        </Box>
      </Box>

      {logData && (
        <Box>
          {/* Summary */}
          {logData.importedEntities && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.50' }}>
              <Typography variant="h6" color="success.main" sx={{ mb: 2 }}>
                ✅ Successfully Imported
              </Typography>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {logData.importedEntities.contentTypes || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Content Types
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {logData.importedEntities.entries || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Entries
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {logData.importedEntities.assets || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assets
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {logData.importedEntities.locales || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Locales
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Errors */}
          {logData.errors && logData.errors.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" color="error" sx={{ mb: 2 }}>
                ❌ Errors ({logData.errors.length})
              </Typography>
              <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                {logData.errors.map((error, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ffcdd2', borderRadius: 1, bgcolor: '#ffebee' }}>
                    <Typography variant="subtitle2" color="error" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {error.type}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {error.message}
                    </Typography>
                    {error.timestamp && (
                      <Typography variant="caption" color="text.secondary">
                        {error.timestamp}
                      </Typography>
                    )}
                    {error.details && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: 'white', borderRadius: 1 }}>
                        <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '11px' }}>
                          {JSON.stringify(error.details, null, 2)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Warnings */}
          {logData.warnings && logData.warnings.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" color="warning.main" sx={{ mb: 2 }}>
                ⚠️ Warnings ({logData.warnings.length})
              </Typography>
              <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
                {logData.warnings.map((warning, index) => (
                  <Box key={index} sx={{ mb: 1, p: 2, border: '1px solid #fff3cd', borderRadius: 1, bgcolor: '#fffbf0' }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {warning.message}
                    </Typography>
                    {warning.timestamp && (
                      <Typography variant="caption" color="text.secondary">
                        {warning.timestamp}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Raw JSON */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              📄 Raw JSON Content
            </Typography>
            <Box sx={{ 
              maxHeight: '500px', 
              overflow: 'auto', 
              bgcolor: '#f5f5f5', 
              p: 2, 
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {rawContent}
              </pre>
            </Box>
          </Paper>
        </Box>
      )}
    </Container>
  );
} 