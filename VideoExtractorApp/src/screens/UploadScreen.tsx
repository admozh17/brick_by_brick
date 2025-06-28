import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

interface ExtractedPlace {
  place_name: string;
  genre: string;
  category_detail: string;
  address: string;
  key_takeaways: string[];
}

interface ProcessingResult {
  activities: ExtractedPlace[];
}

const UploadScreen: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [progress, setProgress] = useState('');
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const API_BASE_URL = 'http://192.168.1.14:8080';

  // Test connection on component mount
  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      console.log('Testing connection to:', `${API_BASE_URL}/api/health`);
      const response = await axios.get(`${API_BASE_URL}/api/health`, {
        timeout: 5000,
      });
      console.log('Connection test successful:', response.data);
      setIsConnected(true);
      
      // Also test POST request
      console.log('Testing POST request to:', `${API_BASE_URL}/api/test`);
      const postResponse = await axios.post(`${API_BASE_URL}/api/test`, {
        test: 'mobile_app_connection',
        timestamp: new Date().toISOString()
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('POST test successful:', postResponse.data);
      
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setIsConnected(false);
    }
  };

  const processUrl = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a video URL');
      return;
    }

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(url)) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    setLoading(true);
    setResult(null);
    setProgress('Initializing...');

    console.log('Starting to process URL:', url);
    console.log('API endpoint:', `${API_BASE_URL}/process-url`);

    try {
      setProgress('Connecting to server...');
      const requestData = { url: url.trim() };
      console.log('Sending request with data:', requestData);
      
      setProgress('Sending video URL to server...');
      const response = await axios.post(`${API_BASE_URL}/process-url`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 300000, // 5 minutes timeout
      });

      console.log('Response received:', response.status, response.data);

      if (response.data.success) {
        setProgress('Processing complete!');
        setResult(response.data.result);
        Alert.alert(
          'Success!',
          `Successfully processed ${response.data.result.activities.length} places from the video.`
        );
      } else {
        setProgress('Processing failed');
        Alert.alert('Error', response.data.error || 'Failed to process video');
      }
    } catch (error: any) {
      console.error('Error processing URL:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      setProgress('Error occurred');
      
      if (error.response?.status === 500) {
        Alert.alert('Processing Error', 'Failed to process the video. Please check the URL and try again.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        Alert.alert('Connection Error', 'Cannot connect to server. Make sure the Flask app is running on 192.168.1.14:8080');
      } else {
        Alert.alert('Error', `An unexpected error occurred: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const clearForm = () => {
    setUrl('');
    setResult(null);
  };

  const renderPlaceCard = (place: ExtractedPlace, index: number) => (
    <Card key={index} style={styles.placeCard} elevation={3}>
      <Card.Content>
        <View style={styles.placeHeader}>
          <Title style={styles.placeName}>{place.place_name}</Title>
          <Chip mode="outlined" style={styles.genreChip}>
            {place.genre}
          </Chip>
        </View>

        {place.category_detail && (
          <Paragraph style={styles.category}>
            <Ionicons name="pricetag" size={16} color="#666" />
            {' '}{place.category_detail}
          </Paragraph>
        )}

        {place.address && (
          <Paragraph style={styles.address}>
            <Ionicons name="location" size={16} color="#666" />
            {' '}{place.address}
          </Paragraph>
        )}

        {place.key_takeaways && place.key_takeaways.length > 0 && (
          <View style={styles.takeawaysContainer}>
            <Text style={styles.takeawaysTitle}>
              Key Takeaways ({place.key_takeaways.length}):
            </Text>
            {place.key_takeaways.map((takeaway, idx) => (
              <View key={idx} style={styles.takeawayItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.takeawayText}>{takeaway}</Text>
              </View>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.uploadCard} elevation={4}>
          <Card.Content>
            <View style={styles.headerContainer}>
              <Ionicons name="add-circle" size={48} color="#667eea" />
              <Title style={styles.title}>Upload Video</Title>
              <Paragraph style={styles.subtitle}>
                Enter an Instagram Reel, TikTok, or YouTube Short URL to extract place information
              </Paragraph>
            </View>

            {/* Connection Status */}
            {isConnected !== null && (
              <View style={styles.connectionStatus}>
                <Ionicons 
                  name={isConnected ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={isConnected ? "#4CAF50" : "#F44336"} 
                />
                <Text style={[
                  styles.connectionText, 
                  { color: isConnected ? "#4CAF50" : "#F44336" }
                ]}>
                  {isConnected ? "Connected to server" : "Cannot connect to server"}
                </Text>
                <Button 
                  mode="text" 
                  onPress={testConnection}
                  style={styles.retryButton}
                >
                  {isConnected ? "Test" : "Retry"}
                </Button>
              </View>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                label="Video URL"
                value={url}
                onChangeText={setUrl}
                mode="outlined"
                placeholder="https://www.instagram.com/reel/..."
                multiline
                numberOfLines={3}
                style={styles.textInput}
                disabled={loading}
              />

              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={processUrl}
                  loading={loading}
                  disabled={loading || !url.trim()}
                  style={styles.processButton}
                  contentStyle={styles.buttonContent}
                >
                  <Ionicons name="play" size={20} color="white" />
                  {' '}Process Video
                </Button>

                <Button
                  mode="outlined"
                  onPress={clearForm}
                  disabled={loading}
                  style={styles.clearButton}
                >
                  Clear
                </Button>
              </View>
            </View>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
                <Text style={styles.loadingText}>
                  {progress}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {result && result.activities && result.activities.length > 0 && (
          <View style={styles.resultsContainer}>
            <Title style={styles.resultsTitle}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              {' '}Extracted Places ({result.activities.length})
            </Title>
            {result.activities.map((place, index) => renderPlaceCard(place, index))}
          </View>
        )}

        {result && result.activities && result.activities.length === 0 && (
          <Card style={styles.noResultsCard} elevation={2}>
            <Card.Content style={styles.noResultsContent}>
              <Ionicons name="information-circle" size={48} color="#FF9800" />
              <Title style={styles.noResultsTitle}>No Places Found</Title>
              <Paragraph style={styles.noResultsText}>
                The video didn't contain any identifiable places or the extraction failed.
                Try a different video or check the URL.
              </Paragraph>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  uploadCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#23242A',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 22,
  },
  subtitle: {
    textAlign: 'center',
    color: '#A0A0A0',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  textInput: {
    marginBottom: 16,
    backgroundColor: '#282A36',
    color: '#FFFFFF',
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  processButton: {
    flex: 1,
    backgroundColor: '#667eea',
    borderRadius: 10,
  },
  buttonContent: {
    height: 48,
  },
  clearButton: {
    borderColor: '#667eea',
    borderRadius: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    textAlign: 'center',
    color: '#A0A0A0',
    paddingHorizontal: 16,
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsTitle: {
    marginBottom: 16,
    color: '#27ae60',
  },
  placeCard: {
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: '#23242A',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  placeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  genreChip: {
    backgroundColor: '#282A36',
    borderColor: '#667eea',
  },
  category: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 12,
  },
  takeawaysContainer: {
    marginTop: 8,
  },
  takeawaysTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  takeawayItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  takeawayText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#A0A0A0',
    lineHeight: 18,
  },
  noResultsCard: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#23242A',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  noResultsContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noResultsTitle: {
    marginTop: 12,
    marginBottom: 8,
    color: '#f39c12',
  },
  noResultsText: {
    textAlign: 'center',
    color: '#A0A0A0',
    lineHeight: 20,
  },
  retryButton: {
    marginLeft: 'auto',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#23242A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#282A36',
  },
  connectionText: {
    marginLeft: 8,
    marginRight: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#A0A0A0',
  },
});

export default UploadScreen; 