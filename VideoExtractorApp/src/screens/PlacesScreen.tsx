import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Card, Title, Paragraph, Chip, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

interface Place {
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
}

const PlacesScreen: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const API_BASE_URL = 'http://192.168.1.9:8080';

  const fetchPlaces = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/places`, {
        params: {
          page: pageNum,
          per_page: 20,
        },
      });

      if (response.data.success) {
        const newPlaces = response.data.places;
        if (refresh) {
          setPlaces(newPlaces);
        } else {
          setPlaces(prev => [...prev, ...newPlaces]);
        }
        setHasMore(newPlaces.length === 20);
        setPage(pageNum);
      } else {
        Alert.alert('Error', response.data.error || 'Failed to fetch places');
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      Alert.alert('Error', 'Failed to connect to server. Make sure the Flask app is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlaces(1, true);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlaces(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchPlaces(page + 1, false);
    }
  };

  const renderPlaceCard = ({ item }: { item: Place }) => {
    const takeaways = item.document.split('Key points: ')[1] || 'No takeaways available';
    
    return (
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.placeName}>{item.metadata.place_name}</Title>
            <Chip 
              mode="outlined" 
              style={styles.genreChip}
              textStyle={styles.chipText}
            >
              {item.metadata.genre}
            </Chip>
          </View>

          {item.metadata.category_detail && (
            <Paragraph style={styles.category}>
              <Ionicons name="pricetag" size={16} color="#666" />
              {' '}{item.metadata.category_detail}
            </Paragraph>
          )}

          {item.metadata.address && (
            <Paragraph style={styles.address}>
              <Ionicons name="location" size={16} color="#666" />
              {' '}{item.metadata.address}
            </Paragraph>
          )}

          <View style={styles.takeawaysContainer}>
            <Text style={styles.takeawaysTitle}>
              Key Takeaways ({item.metadata.takeaways_count}):
            </Text>
            <Text style={styles.takeaways} numberOfLines={3}>
              {takeaways}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.timestamp}>
              <Ionicons name="time" size={14} color="#999" />
              {' '}{new Date(item.metadata.timestamp).toLocaleDateString()}
            </Text>
            {item.metadata.source_url && (
              <Button
                mode="text"
                compact
                onPress={() => Alert.alert('Source', item.metadata.source_url!)}
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
      <Ionicons name="map-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No places found</Text>
      <Text style={styles.emptySubtext}>
        Upload a video to start extracting places
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#667eea" />
        <Text style={styles.loadingText}>Loading more places...</Text>
      </View>
    );
  };

  if (loading && places.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading places...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={places}
        renderItem={renderPlaceCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  placeName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  genreChip: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  chipText: {
    color: '#1976d2',
    fontSize: 12,
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
    color: '#333',
    marginBottom: 4,
  },
  takeaways: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  cardFooter: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
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

export default PlacesScreen; 