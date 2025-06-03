// src/config/theme.ts
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false
};

export const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#e6f7ff',
      100: '#bae7ff',
      200: '#91d5ff',
      300: '#69c0ff',
      400: '#40a9ff',
      500: '#1890ff',
      600: '#096dd9',
      700: '#0050b3',
      800: '#003a8c',
      900: '#002766'
    }
  },
  fonts: {
    heading: '"Noto Sans JP", "Helvetica Neue", Arial, sans-serif',
    body: '"Noto Sans JP", "Helvetica Neue", Arial, sans-serif'
  },
  styles: {
    global: {
      'html, body': {
        backgroundColor: 'gray.50'
      }
    }
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'medium'
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600'
          }
        }
      }
    }
  }
});
