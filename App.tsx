import React, { useState, useEffect } from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

import LoginScreen from './screens/Login';
import RegisterScreen from './screens/Register';
import HomeScreen from './screens/Home';

const Stack = createNativeStackNavigator();

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          <Stack.Screen
            name="Home"
            options={{
              animationTypeForReplace: 'pop',
            }}
          >
            {() => (
              <HomeScreen
                user={user}
                onLogout={() => {
                  setUser(null);
                }}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Group
            screenOptions={{
              animationTypeForReplace: 'pop',
            }}
          >
            {showLogin ? (
              <Stack.Screen
                name="Login"
              >
                {() => (
                  <LoginScreen
                    onNavigateToRegister={() => setShowLogin(false)}
                  />
                )}
              </Stack.Screen>
            ) : (
              <Stack.Screen
                name="Register"
              >
                {() => (
                  <RegisterScreen
                    onNavigateToLogin={() => setShowLogin(true)}
                  />
                )}
              </Stack.Screen>
            )}
          </Stack.Group>
        )}
      </Stack.Navigator>
      <StatusBar barStyle="dark-content" />
    </NavigationContainer>
  );
}
' '