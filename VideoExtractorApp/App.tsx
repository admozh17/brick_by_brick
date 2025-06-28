import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Provider as PaperProvider } from 'react-native-paper';
import { AlbumsProvider } from './src/context/AlbumsContext';
import { PlacesProvider } from './src/context/PlacesContext';

// Import screens
import PlacesScreen from './src/screens/PlacesScreen';
import UploadScreen from './src/screens/UploadScreen';
import SearchScreen from './src/screens/SearchScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AlbumsProvider>
      <PlacesProvider>
        <PaperProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName: keyof typeof Ionicons.glyphMap;

                  if (route.name === 'Places') {
                    iconName = focused ? 'map' : 'map-outline';
                  } else if (route.name === 'Upload') {
                    iconName = focused ? 'add-circle' : 'add-circle-outline';
                  } else if (route.name === 'Search') {
                    iconName = focused ? 'search' : 'search-outline';
                  } else {
                    iconName = 'help-outline';
                  }

                  return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#667eea',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
              })}
            >
              <Tab.Screen 
                name="Places" 
                component={PlacesScreen}
                options={{ title: 'All Places' }}
              />
              <Tab.Screen 
                name="Upload" 
                component={UploadScreen}
                options={{ title: 'Upload Video' }}
              />
              <Tab.Screen 
                name="Search" 
                component={SearchScreen}
                options={{ title: 'Albums' }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </PlacesProvider>
    </AlbumsProvider>
  );
}
