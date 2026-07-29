import React, { useState } from 'react';
import { View, Text, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from './src/config/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import FeedScreen from './src/screens/FeedScreen';
import PostScreen from './src/screens/PostScreen';
import SearchScreen from './src/screens/SearchScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminScreen from './src/screens/AdminScreen';
import NoticeDetailScreen from './src/screens/NoticeDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Feed: '📋',
  Search: '🔍',
  Post: '✍️',
  Admin: '🛡️',
  Profile: '👤',
};

function TabIcon({ routeName, focused }) {
  const emoji = TAB_ICONS[routeName] || '📋';
  
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1.0 : 0.6 }}>
      {emoji}
    </Text>
  );
}

function HomeTabs({ user, onLogout }) {
  const insets = useSafeAreaInsets();
  const isAdmin = user?.role === 'Admin' || user?.username === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          position: 'absolute',
          bottom: Platform.OS === 'android' ? 16 : 30,
          left: 16,
          right: 16,
          borderRadius: 20,
          height: 68,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        tabBarActiveTintColor: Colors.primaryLight,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon routeName={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Feed">
        {(props) => (
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }} edges={['top']}>
            <FeedScreen {...props} user={user} />
          </SafeAreaView>
        )}
      </Tab.Screen>

      <Tab.Screen name="Search">
        {(props) => (
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }} edges={['top']}>
            <SearchScreen {...props} user={user} />
          </SafeAreaView>
        )}
      </Tab.Screen>

      <Tab.Screen name="Post">
        {(props) => (
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }} edges={['top']}>
            <PostScreen {...props} user={user} />
          </SafeAreaView>
        )}
      </Tab.Screen>

      {isAdmin && (
        <Tab.Screen name="Admin">
          {(props) => (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }} edges={['top']}>
              <AdminScreen {...props} user={user} />
            </SafeAreaView>
          )}
        </Tab.Screen>
      )}

      <Tab.Screen name="Profile">
        {(props) => (
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }} edges={['top']}>
            <ProfileScreen {...props} user={user} onLogout={onLogout} />
          </SafeAreaView>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bgDark} />
        <LoginScreen onLogin={handleLogin} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgDark} />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="HomeTabs">
            {(props) => <HomeTabs {...props} user={user} onLogout={handleLogout} />}
          </Stack.Screen>
          <Stack.Screen
            name="NoticeDetail"
            component={NoticeDetailScreen}
            options={{
              headerShown: true,
              headerTitle: 'Notice Details',
              headerStyle: {
                backgroundColor: Colors.bgDark,
              },
              headerTintColor: Colors.textPrimary,
              headerTitleStyle: {
                fontWeight: '700',
                fontSize: 16,
              },
              headerShadowVisible: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
