import React, { useState, useEffect } from 'react';
import { StatusBar, ActivityIndicator, View, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { onAuthStateChanged, User } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase';

import LoginScreen from './screens/Login';
import RegisterScreen from './screens/Register';
import HomeScreen from './screens/Home';
import FinancialHome from './screens/FinancialHome';
import AddTransactionScreen from './screens/AddTransactionScreen';
import EditTransactionScreen from './screens/EditTransactionScreen';
import MotivationalScreen from './screens/MotivationalScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import TransactionsListScreen from './screens/TransactionsListScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  OldHome: undefined;
  MainApp: undefined;
  FinancialHome: undefined;
  AddTransaction: undefined;
};

function DrawnNavigator({ user }: { user: User | null }) {
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showEditTransaction, setShowEditTransaction] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const financialHomeRef = React.useRef<any>(null);

  const handleTransactionAdded = () => {
    setShowAddTransaction(false);
    if (financialHomeRef.current) {
      financialHomeRef.current.refresh?.();
    }
  };

  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowEditTransaction(true);
  };

  const handleDeleteTransaction = async (transaction: any) => {
    try {
      await deleteDoc(doc(db, 'transacoes', transaction.id));
      Alert.alert('Sucesso', 'Transação deletada com sucesso!');
      if (financialHomeRef.current) {
        financialHomeRef.current.refresh?.();
      }
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      Alert.alert('Erro', 'Não foi possível deletar a transação');
    }
  };

  const handleEditSuccess = () => {
    setShowEditTransaction(false);
    setSelectedTransaction(null);
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

  if (showEditTransaction && selectedTransaction) {
    return (
      <EditTransactionScreen
        user={user}
        transaction={selectedTransaction}
        onBack={() => {
          setShowEditTransaction(false);
          setSelectedTransaction(null);
        }}
        onSuccess={handleEditSuccess}
      />
    );
  }

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
        },
      }}
    >
      <Drawer.Screen
        name="FinancialTab"
        options={{
          drawerLabel: '💰 Controle Financeiro',
          title: 'Controle Financeiro',
        }}
      >
        {() => (
          <FinancialHome
            ref={financialHomeRef}
            user={user}
            onAddTransaction={() => setShowAddTransaction(true)}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}
      </Drawer.Screen>

      <Drawer.Screen
        name="Categories"
        options={{
          drawerLabel: '📁 Categorias',
          title: 'Categorias',
        }}
      >
        {() => <CategoriesScreen user={user} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Motivational"
        options={{
          drawerLabel: '🎮 Motivação Diária',
          title: 'Motivação Diária',
        }}
      >
        {() => <MotivationalScreen />}
      </Drawer.Screen>

      <Drawer.Screen
        name="TransactionsList"
        options={{
          drawerLabel: '📋 Todas as transações',
          title: 'Todas as transações',
        }}
      >
        {() => <TransactionsListScreen user={user} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

function MainApp({ user }: { user: User | null }) {
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showEditTransaction, setShowEditTransaction] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const financialHomeRef = React.useRef<any>(null);

  const handleTransactionAdded = () => {
    setShowAddTransaction(false);
    // Recarregar dados sem fazer remount completo
    if (financialHomeRef.current) {
      financialHomeRef.current.refresh?.();
    }
  };

  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowEditTransaction(true);
  };

  const handleDeleteTransaction = async (transaction: any) => {
    try {
      await deleteDoc(doc(db, 'transacoes', transaction.id));
      Alert.alert('Sucesso', 'Transação deletada com sucesso!');
      // Recarregar dados
      if (financialHomeRef.current) {
        financialHomeRef.current.refresh?.();
      }
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      Alert.alert('Erro', 'Não foi possível deletar a transação');
    }
  };

  const handleEditSuccess = () => {
    setShowEditTransaction(false);
    setSelectedTransaction(null);
    // Recarregar dados
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

  if (showEditTransaction && selectedTransaction) {
    return (
      <EditTransactionScreen
        user={user}
        transaction={selectedTransaction}
        onBack={() => {
          setShowEditTransaction(false);
          setSelectedTransaction(null);
        }}
        onSuccess={handleEditSuccess}
      />
    );
  }

  return (
    <FinancialHome
      ref={financialHomeRef}
      user={user}
      onAddTransaction={() => setShowAddTransaction(true)}
      onEditTransaction={handleEditTransaction}
      onDeleteTransaction={handleDeleteTransaction}
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
            {() => <DrawnNavigator user={user} />}
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
                    onBack={() => setShowLogin(false)}
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
                    onBack={() => setShowLogin(true)}
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