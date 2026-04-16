import React, { useState, useEffect } from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

import LoginScreen from './screens/Login';
import RegisterScreen from './screens/Register';
import HomeScreen from './screens/Home';
import FinancialHome from './screens/FinancialHome';
import AddTransactionScreen from './screens/AddTransactionScreen';

const Stack = createNativeStackNavigator();

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  OldHome: undefined;
  MainApp: undefined;
  FinancialHome: undefined;
  AddTransaction: undefined;
};

function MainApp({ user }: { user: User | null }) {
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const financialHomeRef = React.useRef<any>(null);

  const handleTransactionAdded = () => {
    setShowAddTransaction(false);
    // Recarregar dados sem fazer remount completo
    if (financialHomeRef.current) {
      financialHomeRef.current.refresh?.();
    }
  };

  if (showAddTransaction) {
    return (
      <AddTransactionScreen
        user={user}
        onBack={() => setShowAddTransaction(false)}
        onSuccess={handleTransactionAdded}
      />
    );
  }

  return (
    <FinancialHome
      ref={financialHomeRef}
      user={user}
      onAddTransaction={() => setShowAddTransaction(true)}
    />
  );
}

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
            name="MainApp"
            options={{
              animationTypeForReplace: 'pop',
            }}
          >
            {() => <MainApp user={user} />}
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