import { StyleSheet, View, Platform, Text, ActivityIndicator, Linking, Alert, BackHandler, Share } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
// import * as MediaLibrary from 'expo-media-library'; // Uncomment when building standalone app for saving to gallery
import * as Location from 'expo-location';
import { useEffect, useState, useRef } from 'react';

// All web assets that need to be copied
const webAssets: Record<string, any> = {
  // HTML files
  'distanta.html': require('@/assets/web/distanta.html'),
  'distanta2.html': require('@/assets/web/distanta2.html'),
  'contact.html': require('@/assets/web/contact.html'),
  'coordonatelelocatiei.html': require('@/assets/web/coordonatelelocatiei.html'),
  'coordonatelelocatiei2.html': require('@/assets/web/coordonatelelocatiei2.html'),
  'distantadelalocatiacurentalaoadresa.html': require('@/assets/web/distantadelalocatiacurentalaoadresa.html'),
  'distantadintredouaadrese.html': require('@/assets/web/distantadintredouaadrese.html'),
  'distantadintredouaadresehartamap.html': require('@/assets/web/distantadintredouaadresehartamap.html'),
  'distantadintredouaadresehartamap2.html': require('@/assets/web/distantadintredouaadresehartamap2.html'),
  'dmstodd.html': require('@/assets/web/dmstodd.html'),
  'important.html': require('@/assets/web/important.html'),
  'index.html': require('@/assets/web/index.html'),
  'locatiacurenta.html': require('@/assets/web/locatiacurenta.html'),
  'locatii.html': require('@/assets/web/locatii.html'),
  'noutati.html': require('@/assets/web/noutati.html'),
  'plandezbor.html': require('@/assets/web/plandezbor.html'),
  'plandezbor2.html': require('@/assets/web/plandezbor2.html'),
  'rute.html': require('@/assets/web/rute.html'),
  'whatsapp.html': require('@/assets/web/whatsapp.html'),
  
  // CSS files
  'leaflet.css': require('@/assets/web/leaflet.css'),
  'leaflet-routing-machine.css': require('@/assets/web/leaflet-routing-machine.css'),
  'Control.Geocoder.css': require('@/assets/web/Control.Geocoder.css'),
  'materialize.min.css': require('@/assets/web/materialize.min.css'),
  'font.css': require('@/assets/web/font.css'),
  'jqjquery.mobile-1.4.5.min.css': require('@/assets/web/jqjquery.mobile-1.4.5.min.css'),
  
  // Font files (need to be in Misc/ subdirectory to match font.css paths)
  'Misc/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2': require('@/assets/web/Misc/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2'),
  
  // Image files (stored as .png.txt to avoid Metro image processing, will be copied as .png)
  'Img/marker-icon.png': require('@/assets/web/Img/marker-icon.png.txt'),
  'Img/marker-icon-2x.png': require('@/assets/web/Img/marker-icon-2x.png.txt'),
  'Img/marker-shadow.png': require('@/assets/web/Img/marker-shadow.png.txt'),
  'Img/layers.png': require('@/assets/web/Img/layers.png.txt'),
  'Img/layers-2x.png': require('@/assets/web/Img/layers-2x.png.txt'),
  'Img/loading.gif': require('@/assets/web/Img/loading.gif.txt'),
  'Img/distanta.png': require('@/assets/web/Img/distanta.png.txt'),
  'Img/1.png': require('@/assets/web/Img/1.png.txt'),
  'Img/2.png': require('@/assets/web/Img/2.png.txt'),
  'Img/3.png': require('@/assets/web/Img/3.png.txt'),
  'Img/4.png': require('@/assets/web/Img/4.png.txt'),
  'Img/5.png': require('@/assets/web/Img/5.png.txt'),
  'Img/6.png': require('@/assets/web/Img/6.png.txt'),
  'Img/7.png': require('@/assets/web/Img/7.png.txt'),
  'Img/8.png': require('@/assets/web/Img/8.png.txt'),
  'Img/9.png': require('@/assets/web/Img/9.png.txt'),
  
  // JS files (stored as .txt to avoid Metro processing, will be copied as .js)
  'leaflet.js': require('@/assets/web/leaflet.js.txt'),
  'leaflet-routing-machine.js': require('@/assets/web/leaflet-routing-machine.js.txt'),
  'Control.Geocoder.js': require('@/assets/web/Control.Geocoder.js.txt'),
  'materialize.min.js': require('@/assets/web/materialize.min.js.txt'),
  'jquery-3.4.1.min.js': require('@/assets/web/jquery-3.4.1.min.js.txt'),
  'language.js': require('@/assets/web/language.js.txt'),
  'Leaflet.Control.Custom.js': require('@/assets/web/Leaflet.Control.Custom.js.txt'),
  'html2canvas.min.js': require('@/assets/web/html2canvas.min.js.txt'),
  'dom-to-image.min.js': require('@/assets/web/dom-to-image.min.js.txt'),
  'leaflet-image.js': require('@/assets/web/leaflet-image.js.txt'),
  
  // Sound files (stored as .txt to avoid Metro processing)
  'Snd/a.ogg': require('@/assets/web/Snd/a.ogg.txt'),
};

export default function HomeScreen() {
  const [webDir, setWebDir] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('Initializing...');
  const [showSpinner, setShowSpinner] = useState(false);
  const webViewRef = useRef<any>(null);

  // Helper function to handle GPS check
  const handleCheckGPS = async () => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          'GPS Required',
          'Please enable GPS/Location services to use this app.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to use this app.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      } else {
        console.log('Location permission granted');
      }
    } catch (err) {
      console.error('Failed to check GPS:', err);
    }
  };

  // Helper function to show exit dialog
  const handleShowExitDialog = () => {
    Alert.alert(
      'Exit App?',
      'Are you sure you want to exit?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => BackHandler.exitApp() }
      ]
    );
  };

  // Handle messages from WebView
  const handleWebViewMessage = async (event: any) => {
    const message = event.nativeEvent.data;
    
    // Handle console messages from injected script (these are frequent, so check first)
    if (message.startsWith('console:')) {
      const parts = message.replace('console:', '').split(':');
      const level = parts[0]; // log, warn, error, info
      const content = parts.slice(1).join(':');
      
      switch(level) {
        case 'error':
          console.error('[WebView]', content);
          break;
        case 'warn':
          console.warn('[WebView]', content);
          break;
        case 'info':
          console.info('[WebView]', content);
          break;
        default:
          console.log('[WebView]', content);
      }
      return; // Don't log these as regular messages
    }
    
    // Handle webViewReady signal
    if (message.startsWith('webViewReady:')) {
      const url = message.replace('webViewReady:', '');
      console.log('=== WEBVIEW READY ===');
      console.log('Page fully loaded:', url);
      return;
    }
    
    console.log('=== WebView Message Received ===');
    console.log('Message:', message);
    console.log('Message type:', typeof message);
    
    // Try to parse as JSON first
    let parsedMessage: any = null;
    try {
      parsedMessage = JSON.parse(message);
    } catch(e) {
      // Not JSON, use as string
    }
    
    // Handle JSON format messages
    if (parsedMessage && parsedMessage.type) {
      if (parsedMessage.type === 'checkGPS') {
        await handleCheckGPS();
        return;
      } else if (parsedMessage.type === 'showExitDialog') {
        handleShowExitDialog();
        return;
      }
    }
    
    if (message === 'getIntentData') {
      // Handle request for intent data (deep link, shared data, etc.)
      console.log('=== GET INTENT DATA REQUEST ===');
      try {
        const initialUrl = await Linking.getInitialURL();
        console.log('Initial URL:', initialUrl);
        
        // Send intent data back to WebView
        if (webViewRef.current) {
          const intentData = {
            type: 'intentData',
            url: initialUrl,
            timestamp: Date.now()
          };
          webViewRef.current.injectJavaScript(`
            if (window.onIntentData) {
              window.onIntentData(${JSON.stringify(intentData)});
            }
            if (window.handleIntentData) {
              window.handleIntentData(${JSON.stringify(intentData)});
            }
            console.log('Intent data received:', ${JSON.stringify(JSON.stringify(intentData))});
            true;
          `);
        }
      } catch (err) {
        console.error('Failed to get intent data:', err);
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            console.error('Failed to get intent data: ${(err as Error).message}');
            true;
          `);
        }
      }
      return;
    } else if (message === 'showSpinner') {
      setShowSpinner(true);
    } else if (message === 'hideSpinner') {
      setShowSpinner(false);
    } else if (message.startsWith('pageStart:')) {
      // Page started loading - JavaScript is running
      const page = message.replace('pageStart:', '');
      console.log('=== PAGE START ===');
      console.log('JavaScript running on page:', page);
    } else if (message.startsWith('scriptLoaded:')) {
      // External script loaded successfully
      const script = message.replace('scriptLoaded:', '');
      console.log('=== SCRIPT LOADED ===');
      console.log('Script:', script);
    } else if (message.startsWith('bridgeTest:')) {
      // Bridge test from HTML pages
      const page = message.replace('bridgeTest:', '');
      console.log('=== BRIDGE TEST SUCCESS ===');
      console.log('Bridge working from page:', page);
    } else if (message.startsWith('jsError:')) {
      // JavaScript error from HTML pages
      const error = message.replace('jsError:', '');
      console.error('=== JS ERROR FROM WEBVIEW ===');
      console.error(error);
    } else if (message.startsWith('createFolder:')) {
      // Create folder in app's document directory
      // Note: For saving to device's public Pictures folder, use MediaLibrary when saving actual files
      const folderPath = message.replace('createFolder:', '');
      const fullPath = FileSystem.documentDirectory + folderPath;
      try {
        const dirInfo = await FileSystem.getInfoAsync(fullPath);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(fullPath, { intermediates: true });
          console.log('Created folder:', fullPath);
        } else {
          console.log('Folder already exists:', fullPath);
        }
      } catch (err) {
        console.error('Failed to create folder:', folderPath, err);
      }
    } else if (message.startsWith('openUrl:')) {
      // Open URL in external browser/app
      const url = message.replace('openUrl:', '');
      try {
        await Linking.openURL(url);
      } catch (err) {
        console.error('Failed to open URL:', url, err);
      }
    } else if (message === 'checkGPS') {
      await handleCheckGPS();
    } else if (message === 'showExitDialog') {
      handleShowExitDialog();
    } else if (message.startsWith('shareText:')) {
      // Share text via native share dialog
      const text = message.replace('shareText:', '');
      console.log('=== SHARE TEXT ACTION ===');
      console.log('Sharing text:', text);
      try {
        const result = await Share.share({ message: text });
        console.log('Share result:', result);
      } catch (err) {
        console.error('Failed to share text:', err);
        Alert.alert('Share Error', 'Failed to share: ' + (err as Error).message);
      }
    } else if (message.startsWith('openFolder:')) {
      // Open folder - on mobile, we can show the screenshots directory path
      const folderName = message.replace('openFolder:', '');
      // Screenshots are saved in Pictures/screenshots/
      const folderPath = FileSystem.documentDirectory + 'Pictures/' + folderName + '/';
      console.log('=== OPEN FOLDER REQUEST ===');
      console.log('Folder path:', folderPath);
      try {
        const dirInfo = await FileSystem.getInfoAsync(folderPath);
        console.log('Folder exists:', dirInfo.exists);
        if (dirInfo.exists) {
          // List files in the folder
          const files = await FileSystem.readDirectoryAsync(folderPath);
          console.log('Files found:', files);
          if (files.length > 0) {
            // Sort files by name (newest first since we use date in filename)
            const sortedFiles = files.sort().reverse();
            Alert.alert(
              'Screenshots',
              `Found ${files.length} screenshot(s):\n\n${sortedFiles.slice(0, 10).join('\n')}${files.length > 10 ? '\n...' : ''}`,
              [
                { 
                  text: 'Share Latest', 
                  onPress: async () => {
                    const latestFile = folderPath + sortedFiles[0];
                    try {
                      if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(latestFile);
                      }
                    } catch (e) {
                      console.error('Share error:', e);
                    }
                  }
                },
                { text: 'OK' }
              ]
            );
          } else {
            Alert.alert('Screenshots', 'No screenshots saved yet.');
          }
        } else {
          Alert.alert('Screenshots', 'No screenshots saved yet.\n\nTake a screenshot first using the menu.');
        }
      } catch (err) {
        console.error('Failed to open folder:', err);
        Alert.alert('Error', 'Could not access screenshots folder: ' + (err as Error).message);
      }
    } else if (message.startsWith('shareImage:')) {
      // Share an image file
      const filename = message.replace('shareImage:', '');
      const imagePath = FileSystem.documentDirectory + 'Pictures/screenshots/' + filename;
      console.log('=== SHARE IMAGE REQUEST ===');
      console.log('Image path:', imagePath);
      console.log('Filename:', filename);
      try {
        const fileInfo = await FileSystem.getInfoAsync(imagePath);
        console.log('File exists:', fileInfo.exists);
        if (fileInfo.exists) {
          // Use expo-sharing for file sharing
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(imagePath, {
              mimeType: 'image/jpeg',
              dialogTitle: 'Share Route Screenshot'
            });
          } else {
            // Fallback to Share API
            await Share.share({
              url: imagePath,
              message: 'Route Screenshot: ' + filename
            });
          }
        } else {
          // File not found - list available files
          const screenshotsDir = FileSystem.documentDirectory + 'Pictures/screenshots/';
          const dirInfo = await FileSystem.getInfoAsync(screenshotsDir);
          if (dirInfo.exists) {
            const files = await FileSystem.readDirectoryAsync(screenshotsDir);
            console.log('Available files:', files);
            if (files.length > 0) {
              Alert.alert(
                'Screenshot Not Found',
                `"${filename}" was not found.\n\nAvailable screenshots:\n${files.slice(0, 5).join('\n')}`,
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert('No Screenshots', 'No screenshots have been saved yet.');
            }
          } else {
            Alert.alert('No Screenshots', 'No screenshots have been saved yet.');
          }
        }
      } catch (err) {
        console.error('Failed to share image:', err);
        Alert.alert('Share Error', 'Failed to share image: ' + (err as Error).message);
      }
    } else if (message.startsWith('openImage:')) {
      // Open/view an image file with app chooser
      const filename = message.replace('openImage:', '');
      const imagePath = FileSystem.documentDirectory + 'Pictures/screenshots/' + filename;
      console.log('=== OPEN IMAGE REQUEST ===');
      console.log('Image path:', imagePath);
      console.log('Filename:', filename);
      try {
        const fileInfo = await FileSystem.getInfoAsync(imagePath);
        console.log('File exists:', fileInfo.exists);
        if (fileInfo.exists) {
          if (Platform.OS === 'android') {
            // On Android, use IntentLauncher to open with app chooser
            try {
              // Get content URI for the file
              const contentUri = await FileSystem.getContentUriAsync(imagePath);
              console.log('Content URI:', contentUri);
              await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                data: contentUri,
                flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                type: 'image/jpeg'
              });
            } catch (intentErr) {
              console.error('IntentLauncher error:', intentErr);
              // Fallback to sharing
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(imagePath, {
                  mimeType: 'image/jpeg',
                  dialogTitle: 'Open with...'
                });
              }
            }
          } else {
            // On iOS, use Sharing or Linking
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(imagePath, {
                mimeType: 'image/jpeg',
                dialogTitle: 'Open Screenshot'
              });
            } else {
              // Fallback
              Alert.alert(
                'Screenshot',
                `File: ${filename}\n\nThe image was saved successfully.`,
                [
                  { text: 'Share', onPress: async () => {
                    try {
                      await Share.share({ url: imagePath });
                    } catch (e) {
                      console.error('Share error:', e);
                    }
                  }},
                  { text: 'OK' }
                ]
              );
            }
          }
        } else {
          // File not found - check for available files
          const screenshotsDir = FileSystem.documentDirectory + 'Pictures/screenshots/';
          const dirInfo = await FileSystem.getInfoAsync(screenshotsDir);
          if (dirInfo.exists) {
            const files = await FileSystem.readDirectoryAsync(screenshotsDir);
            console.log('Available files:', files);
            if (files.length > 0) {
              const latestFile = files.sort().reverse()[0];
              Alert.alert(
                'Screenshot Not Found',
                `"${filename}" was not found.\n\nWould you like to open the latest screenshot instead?\n\n${latestFile}`,
                [
                  { text: 'Open Latest', onPress: async () => {
                    const latestPath = screenshotsDir + latestFile;
                    try {
                      if (Platform.OS === 'android') {
                        const contentUri = await FileSystem.getContentUriAsync(latestPath);
                        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                          data: contentUri,
                          flags: 1,
                          type: 'image/jpeg'
                        });
                      } else if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(latestPath, {
                          mimeType: 'image/jpeg',
                          dialogTitle: 'Open Screenshot'
                        });
                      }
                    } catch (e) {
                      console.error('Open error:', e);
                    }
                  }},
                  { text: 'Cancel' }
                ]
              );
            } else {
              Alert.alert('No Screenshots', 'No screenshots have been saved yet.');
            }
          } else {
            Alert.alert('No Screenshots', 'No screenshots have been saved yet.');
          }
        }
      } catch (err) {
        console.error('Failed to open image:', err);
        Alert.alert('Error', 'Could not open image: ' + (err as Error).message);
      }
    } else if (message.startsWith('saveScreenshot:')) {
      // Save screenshot from base64 data
      const dataStr = message.replace('saveScreenshot:', '');
      console.log('=== SAVE SCREENSHOT REQUEST ===');
      try {
        const data = JSON.parse(dataStr);
        const { filename, dataUrl } = data;
        console.log('Saving screenshot:', filename);
        
        // Create screenshots folder if it doesn't exist
        const screenshotsDir = FileSystem.documentDirectory + 'Pictures/screenshots/';
        const dirInfo = await FileSystem.getInfoAsync(screenshotsDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(screenshotsDir, { intermediates: true });
          console.log('Created screenshots directory');
        }
        
        // Convert data URL to base64 string (remove prefix)
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        
        // Save the file
        const filePath = screenshotsDir + filename;
        await FileSystem.writeAsStringAsync(filePath, base64Data, {
          encoding: FileSystem.EncodingType.Base64
        });
        
        // Verify the file was saved
        const savedFileInfo = await FileSystem.getInfoAsync(filePath);
        if (savedFileInfo.exists) {
          console.log('Screenshot saved successfully:', filePath);
          console.log('File size:', savedFileInfo.size);
          
          // Inject success confirmation back to WebView - update localStorage
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              localStorage.setItem('lastroute', '${filename}');
              console.log('Screenshot saved: ${filename}');
              true;
            `);
          }
        } else {
          throw new Error('File verification failed');
        }
        
        // Optional: Save to device gallery using MediaLibrary (requires permission)
        // Uncomment when building standalone app:
        // const { status } = await MediaLibrary.requestPermissionsAsync();
        // if (status === 'granted') {
        //   await MediaLibrary.saveToLibraryAsync(filePath);
        //   console.log('Screenshot saved to gallery');
        // }
        
      } catch (err) {
        console.error('Failed to save screenshot:', err);
        // Inject error message back to WebView
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            alert('Failed to save screenshot: ${(err as Error).message}');
            true;
          `);
        }
      }
    } else if (message.startsWith('listFolder:')) {
      // List files in a folder and send back to WebView
      const folderName = message.replace('listFolder:', '');
      const folderPath = FileSystem.documentDirectory + 'Pictures/' + folderName + '/';
      console.log('=== LIST FOLDER REQUEST ===');
      console.log('Folder path:', folderPath);
      try {
        const dirInfo = await FileSystem.getInfoAsync(folderPath);
        let files: string[] = [];
        if (dirInfo.exists) {
          files = await FileSystem.readDirectoryAsync(folderPath);
          console.log('Files found:', files);
        } else {
          console.log('Folder does not exist yet');
        }
        // Send file list back to WebView
        if (webViewRef.current) {
          const filesJson = JSON.stringify(files);
          webViewRef.current.injectJavaScript(`
            if (typeof window.showScreenshotList === 'function') {
              window.showScreenshotList(${filesJson}, '${folderPath}');
            }
            true;
          `);
        }
      } catch (err) {
        console.error('Failed to list folder:', err);
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            alert('Failed to list folder: ${(err as Error).message}');
            true;
          `);
        }
      }
    } else if (message.startsWith('deleteFile:')) {
      // Delete a file from screenshots folder
      const filename = message.replace('deleteFile:', '');
      const filePath = FileSystem.documentDirectory + 'Pictures/screenshots/' + filename;
      console.log('=== DELETE FILE REQUEST ===');
      console.log('File path:', filePath);
      try {
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(filePath, { idempotent: true });
          console.log('File deleted:', filename);
          // Verify deletion
          const checkInfo = await FileSystem.getInfoAsync(filePath);
          const success = !checkInfo.exists;
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              if (typeof window.onFileDeleted === 'function') {
                window.onFileDeleted('${filename}', ${success});
              }
              true;
            `);
          }
        } else {
          console.log('File does not exist:', filename);
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              alert('File not found: ${filename}');
              true;
            `);
          }
        }
      } catch (err) {
        console.error('Failed to delete file:', err);
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            if (typeof window.onFileDeleted === 'function') {
              window.onFileDeleted('${filename}', false);
            }
            true;
          `);
        }
      }
    } else {
      // Log unhandled messages for debugging
      console.log('=== UNHANDLED MESSAGE ===');
      console.log('Message not handled:', message);
    }
  };

  // Handle Android hardware back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backAction = () => {
        // Inject JavaScript to trigger back navigation in WebView
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            if (typeof goBack === 'function') {
              goBack();
            } else {
              history.back();
            }
            true;
          `);
        }
        return true; // Prevent default back behavior
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      copyWebAssets();
    }
  }, []);

  async function copyWebAssets() {
    try {
      const targetDir = FileSystem.documentDirectory + 'web/';
      
      console.log('=== COPYING WEB ASSETS ===');
      console.log('Target directory:', targetDir);
      
      // Delete existing web directory to ensure fresh copy
      const dirInfo = await FileSystem.getInfoAsync(targetDir);
      if (dirInfo.exists) {
        console.log('Deleting existing web directory...');
        await FileSystem.deleteAsync(targetDir, { idempotent: true });
      }
      await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });

      // Copy all assets (always overwrite)
      const assetNames = Object.keys(webAssets);
      console.log('Total assets to copy:', assetNames.length);
      
      for (let i = 0; i < assetNames.length; i++) {
        const filename = assetNames[i];
        const moduleId = webAssets[filename];
        
        setProgress(`Loading ${filename}... (${i + 1}/${assetNames.length})`);
        
        const destPath = targetDir + filename;
        
        // Create subdirectory if needed (e.g., for Misc/font.woff2)
        if (filename.includes('/')) {
          const subDir = targetDir + filename.substring(0, filename.lastIndexOf('/'));
          await FileSystem.makeDirectoryAsync(subDir, { intermediates: true });
        }
        
        const asset = Asset.fromModule(moduleId);
        await asset.downloadAsync();
        
        if (asset.localUri) {
          await FileSystem.copyAsync({
            from: asset.localUri,
            to: destPath,
          });
          console.log('Copied:', filename);
        } else {
          console.error('Failed to get localUri for:', filename);
        }
      }
      
      console.log('=== ALL ASSETS COPIED ===');

      setWebDir(targetDir);
      setLoading(false);
    } catch (err) {
      console.error('Failed to copy web assets:', err);
      setError(String(err));
      setLoading(false);
    }
  }

  // On web, redirect to the static HTML page
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.location.href = '/web/distanta.html';
    }
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>{progress}</Text>
      </View>
    );
  }

  // Show error
  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{ color: 'red', padding: 20, textAlign: 'center' }}>Error: {error}</Text>
      </View>
    );
  }

  // Show message if no webDir
  if (!webDir) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Failed to initialize web directory</Text>
      </View>
    );
  }

  // On native platforms, use WebView with file URI
  const { WebView } = require('react-native-webview');
  
  // JavaScript to inject BEFORE content loads - ensures ReactNativeWebView bridge is available
  const injectedJavaScriptBeforeContentLoaded = `
    (function() {
      // Ensure ReactNativeWebView is available immediately
      if (!window.ReactNativeWebView) {
        console.log('[Bridge] ReactNativeWebView not found, waiting...');
      } else {
        console.log('[Bridge] ReactNativeWebView already available');
      }
      
      // Mark that we're in React Native WebView environment
      window.isReactNativeWebView = true;
      
      // Store original console methods
      var originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info
      };
      
      // Override console methods to forward to React Native
      ['log', 'warn', 'error', 'info'].forEach(function(method) {
        console[method] = function() {
          // Call original console method
          originalConsole[method].apply(console, arguments);
          
          // Forward to React Native if available
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            try {
              var args = Array.prototype.slice.call(arguments);
              var message = args.map(function(arg) {
                if (arg === null) return 'null';
                if (arg === undefined) return 'undefined';
                if (typeof arg === 'object') {
                  try { return JSON.stringify(arg); } catch(e) { return String(arg); }
                }
                return String(arg);
              }).join(' ');
              window.ReactNativeWebView.postMessage('console:' + method + ':' + message);
            } catch(e) {
              // Silently fail if postMessage fails
            }
          }
        };
      });
      
      // Also catch unhandled errors
      window.onerror = function(message, source, lineno, colno, error) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage('jsError:' + message + ' at ' + source + ':' + lineno + ':' + colno);
        }
        return false;
      };
      
      console.log('[Bridge] Console intercept installed');
      true;
    })();
  `;
  
  // JavaScript to inject AFTER content loads - for additional setup
  const injectedJavaScript = `
    (function() {
      console.log('[Injected] Post-load script running');
      console.log('[Injected] ReactNativeWebView available:', !!window.ReactNativeWebView);
      
      // Send ready signal
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage('webViewReady:' + window.location.href);
      }
      true;
    })();
  `;
  
  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: webDir + 'distanta.html' }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        geolocationEnabled={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleWebViewMessage}
        onLoadStart={(event: any) => {
          console.log('WebView loading:', event.nativeEvent.url);
        }}
        onError={(syntheticEvent: any) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
        onLoadEnd={() => {
          console.log('WebView loaded successfully');
        }}
        onConsoleMessage={(event: any) => {
          console.log('WebView Console:', event.nativeEvent.message);
        }}
      />
      {showSpinner && (
        <View style={styles.spinnerOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '80%',
    marginTop: 50,
  },
  spinnerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
