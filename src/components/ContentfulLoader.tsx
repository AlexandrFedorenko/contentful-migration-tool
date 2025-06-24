import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';

// Анимация заполнения цветом
const fillAnimation = keyframes`
  0% {
    opacity: 0.2;
  }
  100% {
    opacity: 1;
  }
`;

interface ContentfulLoaderProps {
  message?: string;
}

const ContentfulLoader: React.FC<ContentfulLoaderProps> = ({ message = 'Loading...' }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      my: 4
    }}>
      {/* Логотип Contentful с анимацией */}
      <Box sx={{ position: 'relative', width: 120, height: 120, mb: 2 }}>
        {/* Базовый (серый) логотип */}
        <Box 
          component="img" 
          src="/contentful-logo-gray.svg" 
          alt="Contentful Logo"
          sx={{ 
            width: '100%', 
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        />
        
        {/* Цветной логотип с анимацией */}
        <Box 
          component="img" 
          src="/contentful-logo-color.svg" 
          alt="Contentful Logo"
          sx={{ 
            width: '100%', 
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            animation: `${fillAnimation} 1.5s ease-in-out infinite alternate`,
          }}
        />
        
        {/* Индикатор загрузки вокруг логотипа */}
        <CircularProgress 
          size={130} 
          thickness={1.5}
          sx={{ 
            position: 'absolute', 
            top: -5, 
            left: -5,
            color: '#0078FF'
          }} 
        />
      </Box>
      
      {/* Сообщение под логотипом */}
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default ContentfulLoader; 