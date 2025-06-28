import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

export interface Album {
  id: string;
  name: string;
  placeIds: string[];
}

interface AlbumsContextType {
  albums: Album[];
  refreshAlbums: () => void;
  addAlbum: (name: string) => Promise<void>;
  addPlacesToAlbum: (albumId: string, placeIds: string[]) => Promise<void>;
  deleteAlbum: (albumId: string) => Promise<void>;
  removePlaceFromAlbums: (placeId: string) => Promise<void>;
}

export const AlbumsContext = createContext<AlbumsContextType | undefined>(undefined);

export const AlbumsProvider = ({ children }: { children: ReactNode }) => {
  const [albums, setAlbums] = useState<Album[]>([]);

  const API_BASE_URL = 'http://192.168.1.14:8080';

  const refreshAlbums = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/albums`);
      if (res.data.success) {
        setAlbums(res.data.albums);
      }
    } catch (e) {
      setAlbums([]);
    }
  };

  const addAlbum = async (name: string) => {
    await axios.post(`${API_BASE_URL}/albums`, { name });
    await refreshAlbums();
  };

  const addPlacesToAlbum = async (albumId: string, placeIds: string[]) => {
    await axios.post(`${API_BASE_URL}/albums/add_places`, { albumId, placeIds });
    await refreshAlbums();
  };

  const deleteAlbum = async (albumId: string) => {
    await axios.delete(`${API_BASE_URL}/albums/${albumId}`);
    await refreshAlbums();
  };

  const removePlaceFromAlbums = async (placeId: string) => {
    await refreshAlbums();
  };

  useEffect(() => {
    refreshAlbums();
  }, []);

  return (
    <AlbumsContext.Provider value={{ albums, refreshAlbums, addAlbum, addPlacesToAlbum, deleteAlbum, removePlaceFromAlbums }}>
      {children}
    </AlbumsContext.Provider>
  );
}; 