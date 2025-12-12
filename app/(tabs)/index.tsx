import { StyleSheet, View, Platform, Text, ActivityIndicator } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useState } from 'react';

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
};

export default function HomeScreen() {
  const [webDir, setWebDir] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('Initializing...');
  const [showSpinner, setShowSpinner] = useState(false);

  // Handle messages from WebView
  const handleWebViewMessage = (event: any) => {
    const message = event.nativeEvent.data;
    if (message === 'showSpinner') {
      setShowSpinner(true);
    } else if (message === 'hideSpinner') {
      setShowSpinner(false);
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web') {
      copyWebAssets();
    }
  }, []);

  async function copyWebAssets() {
    try {
      const targetDir = FileSystem.documentDirectory + 'web/';
      
      // Delete existing web directory to ensure fresh copy
      const dirInfo = await FileSystem.getInfoAsync(targetDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(targetDir, { idempotent: true });
      }
      await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });

      // Copy all assets (always overwrite)
      const assetNames = Object.keys(webAssets);
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
        }
      }

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
  
  return (
    <View style={styles.container}>
      <WebView
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
        onMessage={handleWebViewMessage}
        onError={(syntheticEvent: any) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
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
