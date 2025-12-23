import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import styles from './ContentfulLoader.module.css';

interface ContentfulLoaderProps {
  message?: string;
}

const ContentfulLoader = React.memo<ContentfulLoaderProps>(({ message = 'Loading...' }) => {
  return (
    <Box className={styles.container}>
      <Box className={styles.logoContainer}>
        <Box 
          component="img" 
          src="/contentful-logo-gray.svg" 
          alt="Contentful Logo"
          className={styles.logoBase}
        />
        
        <Box 
          component="img" 
          src="/contentful-logo-color.svg" 
          alt="Contentful Logo"
          className={styles.logoAnimated}
        />
        
        <CircularProgress 
          size={130} 
          thickness={1.5}
          className={styles.progress}
          sx={{ color: '#0078FF' }}
        />
      </Box>
      
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
});

ContentfulLoader.displayName = 'ContentfulLoader';

export default ContentfulLoader; 