import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Provider as PaperProvider } from 'react-native-paper';
import { AlbumsProvider } from './src/context/AlbumsContext';
import { PlacesProvider } from './src/context/PlacesContext';

// Import screens
import PlacesScreen from './src/screens/PlacesScreen';
import UploadScreen from './src/screens/UploadScreen';
import SearchScreen from './src/screens/SearchScreen';
import AlbumDetailScreen from './src/screens/AlbumDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Albums tab
const AlbumsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#23242A',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="AlbumsList" 
      component={SearchScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="AlbumDetail" 
      component={AlbumDetailScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

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
                  } else if (route.name === 'Albums') {
                    iconName = focused ? 'albums' : 'albums-outline';
                  } else {
                    iconName = 'help-outline';
                  }

                  return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#667eea',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
                tabBarStyle: {
                  backgroundColor: '#23242A',
                  borderTopColor: '#282A36',
                },
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
                name="Albums" 
                component={AlbumsStack}
                options={{ title: 'Albums' }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </PlacesProvider>
    </AlbumsProvider>
  );
}
