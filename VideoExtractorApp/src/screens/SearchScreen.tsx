import React, { useState } from 'react';
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
  SegmentedButtons,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

interface SearchResult {
  id: string;
  metadata: {
    place_name: string;
    genre: string;
    category_detail: string;
    address: string;
    takeaways_count: number;
    timestamp: string;
    source_url?: string;
  };
  document: string;
  distance?: number;
}

const SearchScreen: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('semantic');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const API_BASE_URL = 'http://192.168.1.9:8080';

  const searchPlaces = async () => {
    if (!query.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const response = await axios.get(`${API_BASE_URL}/search`, {
        params: {
          q: query.trim(),
          type: searchType,
          limit: 20,
        },
      });

      if (response.data.success) {
        setResults(response.data.results);
      } else {
        Alert.alert('Error', response.data.error || 'Search failed');
        setResults([]);
      }
    } catch (error: any) {
      console.error('Error searching places:', error);
      if (error.code === 'ECONNREFUSED') {
        Alert.alert('Connection Error', 'Cannot connect to server. Make sure the Flask app is running on localhost:8080');
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  const getSearchExamples = () => {
    const examples = [
      { query: 'romantic restaurant for date night', type: 'semantic' },
      { query: 'outdoor adventure activities', type: 'semantic' },
      { query: 'authentic Italian food', type: 'semantic' },
      { query: 'restaurant', type: 'genre' },
      { query: 'activity', type: 'genre' },
      { query: 'China Pearl', type: 'name' },
    ];

    return examples;
  };

  const useExample = (example: { query: string; type: string }) => {
    setQuery(example.query);
    setSearchType(example.type);
  };

  const renderSearchResult = (result: SearchResult, index: number) => {
    const takeaways = result.document.split('Key points: ')[1] || 'No takeaways available';
    const similarity = result.distance !== undefined ? (1 - result.distance).toFixed(3) : 'N/A';

    return (
      <Card key={result.id} style={styles.resultCard} mode="outlined">
        <Card.Content>
          <View style={styles.resultHeader}>
            <Title style={styles.placeName}>{result.metadata.place_name}</Title>
            <View style={styles.resultChips}>
              <Chip mode="outlined" style={styles.genreChip}>
                {result.metadata.genre}
              </Chip>
              <Chip mode="outlined" style={styles.similarityChip}>
                {similarity}
              </Chip>
            </View>
          </View>

          {result.metadata.category_detail && (
            <Paragraph style={styles.category}>
              <Ionicons name="pricetag" size={16} color="#666" />
              {' '}{result.metadata.category_detail}
            </Paragraph>
          )}

          {result.metadata.address && (
            <Paragraph style={styles.address}>
              <Ionicons name="location" size={16} color="#666" />
              {' '}{result.metadata.address}
            </Paragraph>
          )}

          <View style={styles.takeawaysContainer}>
            <Text style={styles.takeawaysTitle}>
              Key Takeaways ({result.metadata.takeaways_count}):
            </Text>
            <Text style={styles.takeaways} numberOfLines={3}>
              {takeaways}
            </Text>
          </View>

          <View style={styles.resultFooter}>
            <Text style={styles.timestamp}>
              <Ionicons name="time" size={14} color="#999" />
              {' '}{new Date(result.metadata.timestamp).toLocaleDateString()}
            </Text>
            {result.metadata.source_url && (
              <Button
                mode="text"
                compact
                onPress={() => Alert.alert('Source', result.metadata.source_url!)}
              >
                <Ionicons name="link" size={16} color="#667eea" />
                {' '}Source
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No results found</Text>
      <Text style={styles.emptySubtext}>
        Try adjusting your search query or search type
      </Text>
    </View>
  );

  const renderSearchExamples = () => (
    <Card style={styles.examplesCard} mode="outlined">
      <Card.Content>
        <Title style={styles.examplesTitle}>
          <Ionicons name="bulb" size={24} color="#FFC107" />
          {' '}Search Examples
        </Title>
        <View style={styles.examplesGrid}>
          {getSearchExamples().map((example, index) => (
            <Button
              key={index}
              mode="outlined"
              onPress={() => useExample(example)}
              style={styles.exampleButton}
              contentStyle={styles.exampleButtonContent}
            >
              <Text style={styles.exampleText} numberOfLines={2}>
                {example.query}
              </Text>
            </Button>
          ))}
        </View>
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
        <Card style={styles.searchCard} mode="outlined">
          <Card.Content>
            <View style={styles.headerContainer}>
              <Ionicons name="search" size={48} color="#667eea" />
              <Title style={styles.title}>Search Places</Title>
              <Paragraph style={styles.subtitle}>
                Find places using natural language, place names, or genres
              </Paragraph>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                label="Search Query"
                value={query}
                onChangeText={setQuery}
                mode="outlined"
                placeholder="e.g., romantic restaurant, outdoor activities..."
                style={styles.textInput}
                disabled={loading}
              />

              <SegmentedButtons
                value={searchType}
                onValueChange={setSearchType}
                buttons={[
                  { value: 'semantic', label: 'Semantic' },
                  { value: 'name', label: 'Name' },
                  { value: 'genre', label: 'Genre' },
                ]}
                style={styles.segmentedButtons}
              />

              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={searchPlaces}
                  loading={loading}
                  disabled={loading || !query.trim()}
                  style={styles.searchButton}
                  contentStyle={styles.buttonContent}
                >
                  <Ionicons name="search" size={20} color="white" />
                  {' '}Search
                </Button>

                <Button
                  mode="outlined"
                  onPress={clearSearch}
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
                <Text style={styles.loadingText}>Searching places...</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {!hasSearched && renderSearchExamples()}

        {hasSearched && !loading && (
          <View style={styles.resultsContainer}>
            <Title style={styles.resultsTitle}>
              <Ionicons name="list" size={24} color="#4CAF50" />
              {' '}Search Results ({results.length})
            </Title>
            {results.length > 0 ? (
              results.map((result, index) => renderSearchResult(result, index))
            ) : (
              renderEmptyState()
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  searchCard: {
    marginBottom: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
  searchContainer: {
    marginBottom: 16,
  },
  textInput: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  buttonContent: {
    height: 48,
  },
  clearButton: {
    borderColor: '#667eea',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  examplesCard: {
    marginBottom: 16,
  },
  examplesTitle: {
    marginBottom: 16,
    color: '#FFC107',
  },
  examplesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleButton: {
    flex: 1,
    minWidth: '45%',
    borderColor: '#667eea',
  },
  exampleButtonContent: {
    height: 60,
  },
  exampleText: {
    fontSize: 12,
    textAlign: 'center',
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsTitle: {
    marginBottom: 16,
    color: '#4CAF50',
  },
  resultCard: {
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  placeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultChips: {
    flexDirection: 'row',
    gap: 8,
  },
  genreChip: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  similarityChip: {
    backgroundColor: '#f3e5f5',
    borderColor: '#9c27b0',
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  takeawaysContainer: {
    marginBottom: 12,
  },
  takeawaysTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  takeaways: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default SearchScreen; 