import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
  Modal,
} from 'react-native';
import { Card, Title, Paragraph, Chip, Button, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AlbumsContext, Album } from '../context/AlbumsContext';
import { PlacesContext } from '../context/PlacesContext';

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Search state
  const [query, setQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Add state for selected cards
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Add state for delete modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const albumsContext = useContext(AlbumsContext)!;
  const { albums, addAlbum, addPlacesToAlbum } = albumsContext;
  const [albumModalVisible, setAlbumModalVisible] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [albumSelectMode, setAlbumSelectMode] = useState(false);

  const placesContext = useContext(PlacesContext)!;
  const { allPlaces, deletePlace, refreshPlaces } = placesContext;
  const { removePlaceFromAlbums } = albumsContext;

  const API_BASE_URL = 'http://192.168.1.14:8080';

  const loadMore = () => {
    if (hasMore && !loading) {
      // fetchPlaces(page + 1, false);
    }
  };

  // --- Search logic ---
  const searchPlaces = async () => {
    if (!query.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }
    setSearchLoading(true);
    setHasSearched(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/search`, {
        params: {
          q: query.trim(),
          type: 'semantic',
          limit: 20,
        },
      });
      if (response.data.success) {
        setSearchResults(response.data.results);
      } else {
        Alert.alert('Error', response.data.error || 'Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  // Add delete handler
  const handleDelete = async (id: string) => {
    Alert.alert('Delete Place', 'Are you sure you want to delete this place?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deletePlace(id);
          await removePlaceFromAlbums(id);
        } catch (e) {
          Alert.alert('Error', 'Failed to delete place.');
        }
      }},
    ]);
  };

  // Action bar component
  const renderActionBar = () => (
    <View style={styles.actionBar}>
      <Button
        mode="contained"
        onPress={() => setDeleteModalVisible(true)}
        style={styles.actionButton}
        contentStyle={styles.actionButtonContent}
        icon={() => <Ionicons name="trash" size={20} color="#fff" style={{ marginRight: 8 }} />}
      >
        Delete the entry
      </Button>
      <Button
        mode="contained"
        onPress={() => setAlbumModalVisible(true)}
        style={styles.actionButton}
        contentStyle={styles.actionButtonContent}
        icon={() => <Ionicons name="albums" size={20} color="#fff" style={{ marginRight: 8 }} />}
      >
        Add to album
      </Button>
    </View>
  );

  // --- Renderers ---
  const renderPlaceCard = ({ item }: { item: Place }) => {
    // Extract key takeaways from the document string
    let keyTakeaways: string[] = [];
    if (item.document && item.document.includes('Key points:')) {
      const match = item.document.match(/Key points: (.*)/);
      if (match && match[1]) {
        keyTakeaways = match[1].split('. ').map(s => s.trim()).filter(Boolean);
      }
    }
    const isSelected = selectedIds.has(item.id);
    return (
      <Card style={[styles.card, isSelected && { borderColor: '#667eea', borderWidth: 2 }]} elevation={3}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.placeName}>{item.metadata.place_name}</Title>
            <Chip mode="outlined" style={styles.genreChip}>
              <Text style={styles.chipText}>{item.metadata.genre}</Text>
            </Chip>
          </View>
          {item.metadata.category_detail && (
            <Paragraph style={styles.category}>
              <Ionicons name="pricetag" size={16} color="#7f8c8d" />
              {' '}{item.metadata.category_detail}
            </Paragraph>
          )}
          {item.metadata.address && (
            <Paragraph style={styles.address}>
              <Ionicons name="location" size={16} color="#7f8c8d" />
              {' '}{item.metadata.address}
            </Paragraph>
          )}
          <View style={styles.takeawaysContainer}>
            <Text style={styles.takeawaysTitle}>
              Key Takeaways ({keyTakeaways.length}):
            </Text>
            {keyTakeaways.length > 0 ? (
              keyTakeaways.map((takeaway, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={{ marginTop: 2 }} />
                  <Text style={styles.takeaways}>
                    {takeaway}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.takeaways}>
                No specific takeaways available.
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 8 }}>
            <Button
              mode="text"
              onPress={() => {
                setSelectedIds(prev => {
                  const next = new Set(prev);
                  if (next.has(item.id)) next.delete(item.id);
                  else next.add(item.id);
                  return next;
                });
              }}
              style={{ marginRight: 8 }}
              compact
              contentStyle={{ padding: 0 }}
            >
              <Ionicons
                name={isSelected ? 'checkbox' : 'square-outline'}
                size={22}
                color={isSelected ? '#667eea' : '#A0A0A0'}
              />
            </Button>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.timestamp}>
              <Ionicons name="time" size={14} color="#95a5a6" />
              {' '}{new Date(item.metadata.timestamp).toLocaleDateString()}
            </Text>
            {item.metadata.source_url && (
              <Button
                mode="text"
                compact
                onPress={() => {
                  if (item.metadata.source_url) {
                    Linking.openURL(item.metadata.source_url);
                  }
                }}
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

  const renderSearchEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No results found</Text>
      <Text style={styles.emptySubtext}>
        Try adjusting your search query or search type
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

  // --- Main render ---
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search UI */}
        <Card style={styles.searchCard} elevation={4}>
          <Card.Content>
            <View style={styles.searchRow}>
              <TextInput
                label="Search Places"
                value={query}
                onChangeText={setQuery}
                mode="outlined"
                placeholder="e.g., romantic restaurant, outdoor activities..."
                style={styles.textInput}
                placeholderTextColor="#A0A0A0"
                selectionColor="#667eea"
                underlineColor="#667eea"
                activeUnderlineColor="#667eea"
                theme={{ colors: { text: '#FFFFFF', placeholder: '#A0A0A0', primary: '#667eea', background: '#282A36' } }}
                disabled={searchLoading}
              />
              <Button
                mode="contained"
                onPress={searchPlaces}
                loading={searchLoading}
                disabled={searchLoading || !query.trim()}
                style={styles.searchButton}
                contentStyle={styles.buttonContent}
              >
                <Ionicons name="search" size={20} color="white" />
              </Button>
            </View>
            {hasSearched && (
              <Button
                mode="text"
                onPress={clearSearch}
                style={styles.clearButton}
                disabled={searchLoading}
              >
                Clear Search
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Search Results or Default List */}
        {hasSearched ? (
          searchLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.loadingText}>Searching places...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            searchResults.map((item, idx) => renderPlaceCard({ item }))
          ) : (
            renderSearchEmptyState()
          )
        ) : (
          <FlatList
            data={allPlaces}
            renderItem={renderPlaceCard}
            keyExtractor={(item) => String(item.id)}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refreshPlaces} />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.1}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </ScrollView>
      {selectedIds.size > 0 && renderActionBar()}

      <Modal
        visible={albumModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAlbumModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {albums.length === 0 || albumSelectMode ? (
              <>
                <Text style={styles.modalTitle}>Name your album</Text>
                <TextInput
                  value={newAlbumName}
                  onChangeText={setNewAlbumName}
                  placeholder="Album name"
                  style={styles.input}
                  mode="outlined"
                />
                <Button
                  mode="contained"
                  onPress={() => {
                    if (!newAlbumName.trim()) return;
                    addAlbum(newAlbumName.trim());
                    setNewAlbumName('');
                    setAlbumSelectMode(false);
                  }}
                  style={styles.modalButton}
                >
                  Create
                </Button>
                <Button mode="text" onPress={() => setAlbumModalVisible(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Select an album</Text>
                {albums.map((album: Album) => (
                  <Button
                    key={album.id}
                    mode="outlined"
                    style={{ marginBottom: 8, borderColor: '#667eea' }}
                    onPress={() => {
                      addPlacesToAlbum(album.id, Array.from(selectedIds));
                      setAlbumModalVisible(false);
                      setSelectedIds(new Set());
                    }}
                  >
                    {album.name}
                  </Button>
                ))}
                <Button mode="text" onPress={() => setAlbumSelectMode(true)}>
                  + Create new album
                </Button>
                <Button mode="text" onPress={() => setAlbumModalVisible(false)}>
                  Cancel
                </Button>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete {selectedIds.size} place(s)?</Text>
            <Text style={{ color: '#fff', marginBottom: 16 }}>Are you sure you want to delete the selected place(s)? This action cannot be undone.</Text>
            <Button
              mode="contained"
              loading={deleteLoading}
              disabled={deleteLoading || selectedIds.size === 0}
              style={styles.modalButton}
              onPress={async () => {
                if (selectedIds.size === 0) return;
                setDeleteLoading(true);
                console.log('Confirm Delete pressed');
                Alert.alert('Debug', 'Confirm Delete pressed');
                try {
                  console.log('Deleting IDs:', Array.from(selectedIds));
                  for (const id of selectedIds) {
                    console.log('Calling deletePlace for ID:', id);
                    await deletePlace(id);
                    console.log('deletePlace finished for ID:', id);
                    await removePlaceFromAlbums(id);
                  }
                  setSelectedIds(new Set());
                  setDeleteModalVisible(false);
                  setDeleteLoading(false);
                  await refreshPlaces();
                  console.log('Delete complete, refreshed places.');
                } catch (e) {
                  setDeleteLoading(false);
                  setDeleteModalVisible(false);
                  Alert.alert('Error', 'Failed to delete place(s). ' + (e?.message || e));
                  console.error('Delete error:', e);
                }
              }}
            >
              Confirm Delete
            </Button>
            <Button
              mode="text"
              disabled={deleteLoading}
              onPress={() => setDeleteModalVisible(false)}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 3,
    borderRadius: 14,
    backgroundColor: '#23242A',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
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
    color: '#FFFFFF',
  },
  genreChip: {
    backgroundColor: '#282A36',
    borderColor: '#667eea',
  },
  chipText: {
    color: '#A0A0A0',
    fontSize: 12,
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
    marginBottom: 12,
  },
  takeawaysTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  takeaways: {
    fontSize: 13,
    color: '#A0A0A0',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#23242A',
  },
  timestamp: {
    fontSize: 12,
    color: '#A0A0A0',
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
    color: '#A0A0A0',
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
    color: '#A0A0A0',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 8,
    textAlign: 'center',
  },
  searchCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 14,
    backgroundColor: '#23242A',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  textInput: {
    flex: 1,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#667eea',
  },
  buttonContent: {
    paddingHorizontal: 16,
  },
  clearButton: {
    marginTop: 16,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  actionButton: {
    backgroundColor: '#667eea',
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#23242A',
    padding: 24,
    borderRadius: 14,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#667eea',
    marginTop: 16,
  },
});

export default PlacesScreen; 