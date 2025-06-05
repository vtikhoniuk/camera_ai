import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const WebCamera = forwardRef(({ isActive, cameraType }, ref) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isActive, cameraType]);

  const startCamera = async () => {
    try {
      setIsVideoReady(false);
      
      const constraints = {
        video: {
          width: { ideal: screenWidth },
          height: { ideal: screenHeight * 0.8 },
          facingMode: cameraType === 'front' ? 'user' : 'environment'
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          videoRef.current.play().then(() => {
            console.log('Video started playing');
            setTimeout(() => {
              setIsVideoReady(true);
              console.log('Video ready for capture');
            }, 1000); // Give one second for stabilization
          });
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsVideoReady(false);
  };

  const capturePhoto = () => {
    if (!isVideoReady) {
      console.error('Video not ready for capture yet');
      return null;
    }

    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas not available');
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Check that video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video not ready for capture');
      return null;
    }

    // Set canvas size equal to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame on canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get base64 image
    const base64Data = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = base64Data.split(',')[1]; // Remove data:image/jpeg;base64, prefix

    console.log('Photo captured, base64 size:', base64.length);

    return {
      uri: base64Data,
      base64: base64
    };
  };

  // Expose photo capture function through ref
  useImperativeHandle(ref, () => ({
    takePicture: capturePhoto,
    isReady: isVideoReady
  }));

  if (!isActive) return null;

  return (
    <View style={styles.container}>
      <video
        ref={videoRef}
        style={styles.video}
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        style={styles.hiddenCanvas}
      />
      {!isVideoReady && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Preparing camera...</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  hiddenCanvas: {
    display: 'none',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
});

export default WebCamera; 