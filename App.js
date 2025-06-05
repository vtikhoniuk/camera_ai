import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import OpenAI from 'openai';
import { CONFIG } from './config';
import WebCamera from './WebCamera';

const { height: screenHeight } = Dimensions.get('window');

export default function App() {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [cameraType, setCameraType] = useState('back');
  const [webCameraReady, setWebCameraReady] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(CONFIG.PROMPTS.CUSTOM);
  const [tempPrompt, setTempPrompt] = useState('');
  const [appError, setAppError] = useState(null);
  const [initError, setInitError] = useState(null);
  const cameraRef = useRef(null);
  const webCameraRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Error boundary effect
  useEffect(() => {
    const errorHandler = (error, errorInfo) => {
      console.error('App Error:', error);
      console.error('Error Info:', errorInfo);
      setInitError(`App Error: ${error.message}`);
    };
    
    // Catch unhandled promise rejections
    const unhandledRejectionHandler = (event) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      setInitError(`Promise Rejection: ${event.reason}`);
    };
    
    if (Platform.OS === 'web') {
      window.addEventListener('unhandledrejection', unhandledRejectionHandler);
      return () => window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
    }
  }, []);

  // System prompt for image analysis from configuration
  const SYSTEM_PROMPT = CONFIG.SYSTEM_PROMPT === 'CUSTOM' ? customPrompt : CONFIG.PROMPTS[CONFIG.SYSTEM_PROMPT] || CONFIG.PROMPTS.DETAILED_ANALYSIS;

  // OpenAI configuration with error handling
  const openaiRef = useRef(null);
  const [apiKeyError, setApiKeyError] = useState(false);
  
  useEffect(() => {
    const initializeOpenAI = async () => {
      try {
        console.log('=== OpenAI Initialization ===');
        console.log('- Platform:', Platform.OS);
        console.log('- process.env.EXPO_PUBLIC_OPENAI_API_KEY:', process.env.EXPO_PUBLIC_OPENAI_API_KEY ? 'EXISTS' : 'MISSING');
        console.log('- CONFIG.OPENAI_API_KEY:', CONFIG.OPENAI_API_KEY ? 'SET' : 'NOT SET');
        
        if (!CONFIG.OPENAI_API_KEY) {
          console.warn('OpenAI API key not set - demo mode enabled');
          setApiKeyError(true);
          return;
        }
        
        // Only initialize OpenAI for web platform or if we have the key
        if (Platform.OS === 'web' || CONFIG.OPENAI_API_KEY) {
          openaiRef.current = new OpenAI({
            apiKey: CONFIG.OPENAI_API_KEY,
            dangerouslyAllowBrowser: Platform.OS === 'web'
          });
          console.log('OpenAI client initialized successfully');
          setApiKeyError(false);
        }
      } catch (error) {
        console.error('OpenAI initialization error:', error);
        setApiKeyError(true);
      }
    };
    
    initializeOpenAI();
  }, []);

  useEffect(() => {
    const initializePermissions = async () => {
      console.log('=== Permission Initialization ===');
      console.log('App starting, Platform:', Platform.OS);
      
      try {
        if (Platform.OS !== 'web') {
          console.log('Requesting mobile camera permissions...');
          
          // Check if Camera is available
          if (!Camera) {
            throw new Error('Camera module not available');
          }
          
          const cameraPermission = await Camera.requestCameraPermissionsAsync();
          console.log('Camera permission result:', cameraPermission);
          
          const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
          console.log('Media library permission result:', mediaLibraryPermission);
          
          setHasCameraPermission(cameraPermission.status === 'granted');
          setHasMediaLibraryPermission(mediaLibraryPermission.status === 'granted');
          
          console.log('Mobile permissions set successfully');
        } else {
          console.log('Web platform - checking camera access...');
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
            setHasMediaLibraryPermission(true);
            stream.getTracks().forEach(track => track.stop());
            console.log('Web camera access granted');
          } catch (error) {
            console.error('Web camera unavailable:', error);
            setHasCameraPermission(false);
            setHasMediaLibraryPermission(false);
          }
        }
      } catch (error) {
        console.error('Permission request error:', error);
        setInitError(`Permission error: ${error.message}`);
        // Set permissions to false to prevent white screen
        setHasCameraPermission(false);
        setHasMediaLibraryPermission(false);
      }
    };
    
    initializePermissions();
  }, []);

  useEffect(() => {
    // Check web camera readiness periodically
    if (Platform.OS === 'web' && !photo) {
      const interval = setInterval(() => {
        if (webCameraRef.current?.isReady) {
          setWebCameraReady(true);
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    } else {
      setWebCameraReady(false);
    }
  }, [photo, cameraType]);

  useEffect(() => {
    // Load saved custom prompt on app start
    const initializeStorage = async () => {
      try {
        console.log('=== Storage Initialization ===');
        await loadSavedPrompt();
        console.log('Storage initialized successfully');
      } catch (error) {
        console.error('Storage initialization error:', error);
        setInitError(`Storage error: ${error.message}`);
      }
    };
    
    initializeStorage();
  }, []);

  const loadSavedPrompt = async () => {
    try {
      if (!AsyncStorage) {
        console.warn('AsyncStorage not available');
        return;
      }
      
      const savedPrompt = await AsyncStorage.getItem('customPrompt');
      if (savedPrompt) {
        setCustomPrompt(savedPrompt);
        console.log('Saved prompt loaded');
      }
    } catch (error) {
      console.error('Error loading saved prompt:', error);
    }
  };

  const savePrompt = async (prompt) => {
    try {
      await AsyncStorage.setItem('customPrompt', prompt);
    } catch (error) {
      console.error('Error saving prompt:', error);
    }
  };

  const resetToDefaultPrompt = () => {
    setTempPrompt(CONFIG.PROMPTS.CUSTOM);
  };

  const openSettings = () => {
    setTempPrompt(customPrompt);
    setSettingsVisible(true);
  };

  const closeSettings = () => {
    setSettingsVisible(false);
  };

  const saveAndCloseSettings = async () => {
    setCustomPrompt(tempPrompt);
    await savePrompt(tempPrompt);
    setSettingsVisible(false);
    Alert.alert('Saved', 'Prompt saved successfully!');
  };

  const takePicture = async () => {
    try {
      setLoading(true);
      let photoData;

      if (Platform.OS === 'web') {
        // For web version use WebCamera
        
        if (webCameraRef.current) {
          // Check camera readiness
          const isReady = webCameraRef.current.isReady;
          
          if (!isReady) {
            throw new Error('Camera is not ready yet. Wait a few seconds and try again.');
          }
          
          photoData = webCameraRef.current.takePicture();
          
          if (!photoData) {
            throw new Error('Failed to capture image from web camera. Make sure the camera is active.');
          }
        } else {
          console.error('WebCamera ref is null');
          throw new Error('Web camera not initialized. Try reloading the page.');
        }
      } else {
        // For mobile version use Expo Camera
        if (cameraRef.current) {
          photoData = await cameraRef.current.takePictureAsync({
            quality: 0.8,
            base64: true,
          });
          
          // Save photo to gallery
          if (hasMediaLibraryPermission) {
            await MediaLibrary.saveToLibraryAsync(photoData.uri);
          }
        } else {
          throw new Error('Camera not initialized');
        }
      }
      
      setPhoto(photoData);
      
      // Send to OpenAI
      await analyzeImage(photoData.base64);
      
    } catch (error) {
      console.error('Error in takePicture:', error);
      Alert.alert('Error', 'Failed to take photo: ' + error.message);
      setLoading(false);
    }
  };

  const analyzeImage = async (base64Image) => {
    try {
      console.log('Starting image analysis...');
      
      if (!openaiRef.current || apiKeyError) {
        console.log('OpenAI not available - using demo mode');
        console.log('- openaiRef.current:', openaiRef.current ? 'SET' : 'NULL');
        console.log('- apiKeyError:', apiKeyError);
        setResponse('Demo mode: API key not found');
        
        Animated.timing(slideAnim, {
          toValue: -screenHeight * 0.15,
          duration: 500,
          useNativeDriver: true,
        }).start();
        
        setLoading(false);
        return;
      }
      
      console.log('Making OpenAI API request...');
      const response = await openaiRef.current.chat.completions.create({
        model: "gpt-4o", // Using new model
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Проанализируй это изображение"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      console.log('OpenAI API response received');
      const analysisResult = response.choices[0].message.content;
      setResponse(analysisResult);
      
      // Photo slide up animation
      Animated.timing(slideAnim, {
        toValue: -screenHeight * 0.15,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
      });
      
    } catch (error) {
      console.error('OpenAI API Error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        type: error.type
      });
      
      let errorMessage = 'Failed to analyze image: ' + error.message;
      
      if (Platform.OS === 'web') {
        errorMessage += '\n\nNote: Web platform may require HTTPS for full OpenAI API functionality.';
      }
      
      if (error.message.includes('API key')) {
        errorMessage += '\n\nCheck the API key correctness in config.js file';
      }
      
      Alert.alert('API Error', errorMessage);
      
      // Show test response on error for animation demonstration
      setResponse('Test image analysis: The photo shows a camera or screen. This is a demo of the app. For real AI analysis, make sure the OpenAI API key is configured correctly.');
      
      Animated.timing(slideAnim, {
        toValue: -screenHeight * 0.15,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
    } finally {
      setLoading(false);
    }
  };

  const resetCamera = () => {
    setPhoto(null);
    setResponse('');
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const flipCamera = () => {
    setCameraType(prevType => prevType === 'back' ? 'front' : 'back');
  };

  if (hasCameraPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>
          {Platform.OS === 'web' 
            ? 'Checking web camera access...' 
            : 'Requesting camera permission...'
          }
        </Text>
      </View>
    );
  }

  if (hasCameraPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No camera access</Text>
        <Text style={styles.subErrorText}>
          {Platform.OS === 'web' 
            ? 'Please allow camera access in browser'
            : 'Please allow camera access in app settings'
          }
        </Text>
      </View>
    );
  }

  // Show initialization errors
  if (initError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Initialization Error</Text>
        <Text style={styles.subErrorText}>{initError}</Text>
        <Text style={styles.subErrorText}>
          Platform: {Platform.OS}
        </Text>
      </View>
    );
  }

  // Show initialization errors
  if (initError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Initialization Error</Text>
        <Text style={styles.subErrorText}>{initError}</Text>
        <Text style={styles.subErrorText}>
          Platform: {Platform.OS}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Animated.View 
        style={[
          styles.cameraContainer,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        {!photo ? (
          Platform.OS === 'web' ? (
            <WebCamera
              ref={webCameraRef}
              isActive={true}
              cameraType={cameraType}
            />
          ) : (
            Camera ? (
              <Camera 
                style={styles.camera} 
                type={cameraType === 'back' ? Camera.Constants?.Type?.back : Camera.Constants?.Type?.front}
                ref={cameraRef}
                onCameraReady={() => console.log('Camera ready')}
                onMountError={(error) => {
                  console.error('Camera mount error:', error);
                  setInitError(`Camera mount error: ${error.message}`);
                }}
              >
              </Camera>
            ) : (
              <View style={styles.camera}>
                <Text style={styles.errorText}>Camera component not available</Text>
              </View>
            )
          )
        ) : (
          <View style={styles.photoContainer}>
            <Image 
              source={{ uri: photo.uri }} 
              style={styles.photoImage}
              resizeMode="contain"
            />
          </View>
        )}
      </Animated.View>

      {/* Demo mode indicator */}
      {apiKeyError && !photo && (
        <View style={styles.demoModeIndicator}>
          <Text style={styles.demoModeText}>DEMO MODE</Text>
          <Text style={styles.demoModeSubtext}>API key not configured</Text>
        </View>
      )}

      <View style={styles.controlsContainer}>
        <View style={styles.buttonRow}>
          {!photo && (Platform.OS !== 'web' || webCameraReady) && (
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={openSettings}
            >
              <MaterialIcons name="menu" size={24} color="white" />
            </TouchableOpacity>
          )}
          
          {!photo ? (
            <TouchableOpacity 
              style={[styles.captureButton, loading && styles.captureButtonDisabled]}
              onPress={takePicture}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <MaterialIcons name="camera" size={40} color="white" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={resetCamera}
            >
              <MaterialIcons name="refresh" size={30} color="white" />
            </TouchableOpacity>
          )}
          
          {!photo && (Platform.OS !== 'web' || webCameraReady) && (
            <TouchableOpacity 
              style={styles.flipButtonBottom}
              onPress={flipCamera}
            >
              <MaterialIcons name="flip-camera-ios" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {response ? (
        <View style={styles.responseContainer}>
          <ScrollView style={styles.responseScrollView}>
            <Text style={styles.responseText}>{response}</Text>
          </ScrollView>
        </View>
      ) : null}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            Analyzing image...
          </Text>
        </View>
      )}
      
      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Prompt Settings</Text>
          </View>
          
          <View style={styles.modalContent}>
            <TextInput
              style={styles.promptInput}
              value={tempPrompt}
              onChangeText={setTempPrompt}
              multiline
              textAlignVertical="top"
              placeholder="Enter your custom prompt here..."
              placeholderTextColor="#666"
              selectionColor="white"
              underlineColorAndroid="transparent"
              blurOnSubmit={false}
              autoCorrect={false}
              spellCheck={false}
            />
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={resetToDefaultPrompt}
            >
              <Text style={styles.modalButtonText}>Default</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={closeSettings}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={saveAndCloseSettings}
            >
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 20,
    paddingTop: 50,
    zIndex: 10,
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    padding: 10,
  },
  photoContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  controlsContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
    gap: 30,
  },
  captureButton: {
    backgroundColor: '#007AFF',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    backgroundColor: '#666',
  },
  resetButton: {
    backgroundColor: '#007AFF',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
  flipButtonBottom: {
    backgroundColor: '#404040',
    borderRadius: 30,
    padding: 10,
  },
  responseContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    maxHeight: '40%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  responseScrollView: {
    maxHeight: 200,
  },
  responseText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
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
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 10,
  },
  subErrorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  settingsButton: {
    backgroundColor: '#404040',
    borderRadius: 30,
    padding: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  promptInput: {
    flex: 1,
    backgroundColor: '#333',
    color: 'white',
    fontSize: 14,
    borderWidth: 0,
    borderRadius: 8,
    padding: 15,
    outline: 'none',
    borderColor: 'transparent',
    outlineWidth: 0,
    outlineColor: 'transparent',
    boxShadow: 'none',
    ':focus': {
      outline: 'none',
      borderColor: 'transparent',
      boxShadow: 'none',
    },
    WebkitAppearance: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  modalButton: {
    backgroundColor: '#404040',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 15,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
  demoModeIndicator: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
    borderRadius: 8,
    padding: 10,
    zIndex: 100,
  },
  demoModeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  demoModeSubtext: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
});
