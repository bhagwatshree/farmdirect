import React, { useState } from 'react';
import { Box, Typography, MobileStepper, Button } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { getCategoryColor, getCategoryEmoji } from '../utils/constants';

export default function ImageCarousel({ images = [], category, height = 300 }) {
  const [activeStep, setActiveStep] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  const validImages = images.filter(Boolean);
  const color = getCategoryColor(category);
  const emoji = getCategoryEmoji(category);

  // Emoji fallback — shown when no images or all images errored
  const EmojiFallback = () => (
    <Box sx={{ height, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: color }}>
      <Typography fontSize="6rem" lineHeight={1}>{emoji}</Typography>
    </Box>
  );

  if (validImages.length === 0) return <EmojiFallback />;

  // All images failed to load — show fallback
  const allErrored = validImages.every((_, i) => imgErrors[i]);
  if (allErrored) return <EmojiFallback />;

  const handleNext = () => setActiveStep(s => Math.min(s + 1, validImages.length - 1));
  const handleBack = () => setActiveStep(s => Math.max(s - 1, 0));

  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handleBack();
    }
    setTouchStartX(null);
  };

  const handleImgError = (idx) => {
    setImgErrors(prev => ({ ...prev, [idx]: true }));
    // Advance to next valid image if current errored
    if (activeStep === idx && idx < validImages.length - 1) {
      setActiveStep(idx + 1);
    }
  };

  return (
    <Box>
      <Box
        sx={{ height, overflow: 'hidden', position: 'relative', bgcolor: color, userSelect: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {validImages.map((url, idx) => (
          <Box
            key={idx}
            sx={{
              position: 'absolute', inset: 0,
              opacity: idx === activeStep ? 1 : 0,
              transition: 'opacity 0.35s ease',
            }}
          >
            {imgErrors[idx] ? (
              <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: color }}>
                <Typography fontSize="6rem" lineHeight={1}>{emoji}</Typography>
              </Box>
            ) : (
              <img
                src={url}
                alt={`product ${idx + 1}`}
                onError={() => handleImgError(idx)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )}
          </Box>
        ))}
      </Box>

      {validImages.length > 1 && (
        <MobileStepper
          steps={validImages.length}
          position="static"
          activeStep={activeStep}
          sx={{ bgcolor: 'background.paper', px: 1 }}
          nextButton={
            <Button size="small" onClick={handleNext} disabled={activeStep === validImages.length - 1}>
              <KeyboardArrowRight />
            </Button>
          }
          backButton={
            <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
              <KeyboardArrowLeft />
            </Button>
          }
        />
      )}
    </Box>
  );
}
