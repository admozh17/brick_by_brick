import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Alert } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { AlbumsContext, Album } from '../context/AlbumsContext';
import { PlacesContext, Place } from '../context/PlacesContext';
import { Ionicons } from '@expo/vector-icons';

const AlbumDetailScreen: React.FC = ({ route, navigation }: any) => {
  const { album } = route.params;
  const albumsContext = useContext(AlbumsContext)!;
  const { removePlaceFromAlbums } = albumsContext;
  const placesContext = useContext(PlacesContext)!;
  const { allPlaces, deletePlace } = placesContext;

  // Add state for delete modal and loading
  const [deletePlaceModalVisible, setDeletePlaceModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);

  const places = allPlaces.filter((place: Place) => album.placeIds.includes(place.id));

  const handleDeletePlace = async (place: Place) => {
    setPlaceToDelete(place);
    setDeletePlaceModalVisible(true);
  };

  const confirmDeletePlace = async () => {
    if (!placeToDelete) return;
    setDeleteLoading(true);
    try {
      console.log('Deleting place from album:', placeToDelete.id);
      await deletePlace(placeToDelete.id);
      await removePlaceFromAlbums(placeToDelete.id);
      console.log('Place deleted successfully');
      setDeletePlaceModalVisible(false);
      setPlaceToDelete(null);
    } catch (error) {
      console.error('Error deleting place:', error);
      Alert.alert('Error', 'Failed to delete place. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderPlaceCard = ({ item }: { item: Place }) => (
    <Card key={item.id} style={styles.placeCard}>
      <Card.Content style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.placeName}>{item.metadata.place_name}</Text>
          <Text style={styles.placeGenre}>{item.metadata.genre}</Text>
          <Text style={styles.placeAddress}>{item.metadata.address}</Text>
        </View>
        <Button
          mode="text"
          onPress={() => handleDeletePlace(item)}
          compact
          contentStyle={{ padding: 0 }}
        >
          <Ionicons name="trash" size={22} color="#F44336" />
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.albumTitle}>{album.name}</Text>
        <Text style={styles.albumCount}>{places.length} places</Text>
      </View>
      
      <FlatList
        data={places}
        keyExtractor={(item) => item.id}
        renderItem={renderPlaceCard}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No restaurants in this album yet.</Text>
            <Text style={styles.emptySubtext}>
              Add restaurants from the All Places tab
            </Text>
          </View>
        }
        contentContainerStyle={places.length === 0 ? { flex: 1 } : { padding: 16 }}
      />

      {/* Delete Place Confirmation Modal */}
      <Modal
        visible={deletePlaceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeletePlaceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Place?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete "{placeToDelete?.metadata.place_name}"? This will remove it from all albums and cannot be undone.
            </Text>
            <Button
              mode="contained"
              loading={deleteLoading}
              disabled={deleteLoading}
              onPress={confirmDeletePlace}
              style={[styles.modalButton, { backgroundColor: '#F44336' }]}
            >
              Delete Place
            </Button>
            <Button
              mode="text"
              disabled={deleteLoading}
              onPress={() => setDeletePlaceModalVisible(false)}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
  },
  header: {
    padding: 16,
    backgroundColor: '#23242A',
    borderBottomWidth: 1,
    borderBottomColor: '#282A36',
  },
  albumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  albumCount: {
    fontSize: 16,
    color: '#A0A0A0',
  },
  placeCard: {
    marginBottom: 12,
    backgroundColor: '#23242A',
    borderRadius: 12,
  },
  placeName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  placeGenre: {
    color: '#A0A0A0',
    fontSize: 14,
    marginBottom: 2,
  },
  placeAddress: {
    color: '#A0A0A0',
    fontSize: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#23242A',
    borderRadius: 12,
    padding: 24,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalText: {
    color: '#A0A0A0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalButton: {
    width: '100%',
    marginBottom: 8,
    backgroundColor: '#667eea',
  },
});

export default AlbumDetailScreen; 