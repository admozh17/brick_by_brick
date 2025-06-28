import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Button, TextInput, Card } from 'react-native-paper';
import { AlbumsContext, Album } from '../context/AlbumsContext';
import { PlacesContext, Place } from '../context/PlacesContext';
import { Ionicons } from '@expo/vector-icons';

const AlbumsScreen: React.FC = () => {
  const albumsContext = useContext(AlbumsContext)!;
  const { albums, addAlbum, deleteAlbum, removePlaceFromAlbums } = albumsContext;
  const placesContext = useContext(PlacesContext)!;
  const { allPlaces, deletePlace } = placesContext;
  const [modalVisible, setModalVisible] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  // Add state for delete modals and loading
  const [deleteAlbumModalVisible, setDeleteAlbumModalVisible] = useState(false);
  const [deletePlaceModalVisible, setDeletePlaceModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);

  const handleCreateAlbum = () => {
    if (!newAlbumName.trim()) return;
    addAlbum(newAlbumName.trim());
    setNewAlbumName('');
    setModalVisible(false);
  };

  // Add delete handlers with proper error handling
  const handleDeleteAlbum = async (album: Album) => {
    setAlbumToDelete(album);
    setDeleteAlbumModalVisible(true);
  };

  const confirmDeleteAlbum = async () => {
    if (!albumToDelete) return;
    setDeleteLoading(true);
    try {
      console.log('Deleting album:', albumToDelete.id);
      await deleteAlbum(albumToDelete.id);
      console.log('Album deleted successfully');
      setDeleteAlbumModalVisible(false);
      setAlbumToDelete(null);
    } catch (error) {
      console.error('Error deleting album:', error);
      Alert.alert('Error', 'Failed to delete album. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

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
      setSelectedAlbum(null); // Close the album modal
    } catch (error) {
      console.error('Error deleting place:', error);
      Alert.alert('Error', 'Failed to delete place. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderAlbumRestaurants = () => {
    if (!selectedAlbum) return null;
    const places = allPlaces.filter((place: Place) => selectedAlbum.placeIds.includes(place.id));
    return (
      <Modal
        visible={!!selectedAlbum}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAlbum(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '90%', maxHeight: '80%' }]}> 
            <Text style={styles.modalTitle}>{selectedAlbum.name}</Text>
            <ScrollView style={{ width: '100%' }}>
              {places.length === 0 ? (
                <Text style={styles.emptyText}>No restaurants in this album yet.</Text>
              ) : (
                places.map((place: Place) => (
                  <Card key={place.id} style={styles.albumCard}>
                    <Card.Content style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={styles.albumName}>{place.metadata.place_name}</Text>
                        <Text style={styles.albumCount}>{place.metadata.genre}</Text>
                        <Text style={styles.albumCount}>{place.metadata.address}</Text>
                      </View>
                      <Button
                        mode="text"
                        onPress={() => handleDeletePlace(place)}
                        compact
                        contentStyle={{ padding: 0 }}
                      >
                        <Ionicons name="trash" size={22} color="#F44336" />
                      </Button>
                    </Card.Content>
                  </Card>
                ))
              )}
            </ScrollView>
            <Button mode="text" onPress={() => setSelectedAlbum(null)} style={{ marginTop: 12 }}>
              Close
            </Button>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={() => setModalVisible(true)}
        style={styles.createButton}
      >
        Create an Album
      </Button>
      <FlatList
        data={albums}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedAlbum(item)}>
            <Card style={styles.albumCard}>
              <Card.Content style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={styles.albumName}>{item.name}</Text>
                  <Text style={styles.albumCount}>{item.placeIds.length} places</Text>
                </View>
                <Button
                  mode="text"
                  onPress={() => handleDeleteAlbum(item)}
                  compact
                  contentStyle={{ padding: 0 }}
                >
                  <Ionicons name="trash" size={22} color="#F44336" />
                </Button>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No albums yet.</Text>}
        contentContainerStyle={albums.length === 0 ? { flex: 1, justifyContent: 'center', alignItems: 'center' } : undefined}
      />
      
      {/* Create Album Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Name your album</Text>
            <TextInput
              value={newAlbumName}
              onChangeText={setNewAlbumName}
              placeholder="Album name"
              style={styles.input}
              mode="outlined"
            />
            <Button mode="contained" onPress={handleCreateAlbum} style={styles.modalButton}>
              Create
            </Button>
            <Button mode="text" onPress={() => setModalVisible(false)}>
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      {/* Delete Album Confirmation Modal */}
      <Modal
        visible={deleteAlbumModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteAlbumModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Album?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete "{albumToDelete?.name}"? This action cannot be undone.
            </Text>
            <Button
              mode="contained"
              loading={deleteLoading}
              disabled={deleteLoading}
              onPress={confirmDeleteAlbum}
              style={[styles.modalButton, { backgroundColor: '#F44336' }]}
            >
              Delete Album
            </Button>
            <Button
              mode="text"
              disabled={deleteLoading}
              onPress={() => setDeleteAlbumModalVisible(false)}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

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

      {selectedAlbum && renderAlbumRestaurants()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
    padding: 16,
  },
  createButton: {
    marginBottom: 16,
    backgroundColor: '#667eea',
  },
  albumCard: {
    marginBottom: 12,
    backgroundColor: '#23242A',
    borderRadius: 12,
  },
  albumName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  albumCount: {
    color: '#A0A0A0',
    fontSize: 14,
    marginTop: 4,
  },
  emptyText: {
    color: '#A0A0A0',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 32,
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
  input: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#282A36',
  },
  modalButton: {
    width: '100%',
    marginBottom: 8,
    backgroundColor: '#667eea',
  },
});

export default AlbumsScreen; 