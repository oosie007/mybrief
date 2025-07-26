import * as Font from 'expo-font';

export const loadFonts = async () => {
  try {
    // For now, just log that we're using system fonts
    console.log('Using system fonts - Georgia for serif styling');
  } catch (error) {
    console.log('Font loading error:', error);
  }
};

export const fontFamily = {
  regular: 'Georgia',
  bold: 'Georgia-Bold',
  // Fallback fonts
  fallback: {
    regular: 'Georgia',
    bold: 'Georgia-Bold',
  }
}; 