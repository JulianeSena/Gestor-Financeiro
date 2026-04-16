import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import TransactionItem from '../components/TransactionItem';
import SummaryCard from '../components/SummaryCard';

interface Transaction {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'gasto';
  categoriaId: string;
  data: Timestamp;
}

interface FinancialHomeProps {
  user: any;
  onAddTransaction: () => void;
}

interface FinancialHomeRef {
  refresh: () => Promise<void>;
}

function FinancialHomeComponent(
  { user, onAddTransaction }: FinancialHomeProps,
  ref: React.ForwardedRef<FinancialHomeRef>
) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [saldo, setSaldo] = useState(0);

  const formatDate = useCallback((timestamp: Timestamp): string => {
    const date = new Date(timestamp.seconds * 1000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const calculateTotals = useCallback((items: Transaction[]) => {
    let entradas = 0;
    let gastos = 0;

    items.forEach((item) => {
      if (item.tipo === 'entrada') {
        entradas += item.valor;
      } else {
        gastos += item.valor;
      }
    });

    setTotalEntradas(entradas);
    setTotalGastos(gastos);
    setSaldo(entradas - gastos);
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'transacoes'),
        where('userId', '==', user.uid),
        orderBy('data', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const loaded: Transaction[] = [];

      querySnapshot.forEach((doc) => {
        loaded.push({
          id: doc.id,
          ...doc.data(),
        } as Transaction);
      });

      setTransactions(loaded);
      calculateTotals(loaded);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      Alert.alert('Erro', 'Não foi possível carregar as transações');
    } finally {
      setLoading(false);
    }
  }, [user.uid, calculateTotals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  }, [loadTransactions]);

  const handleLogout = useCallback(async () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      {
        text: 'Cancelar',
        onPress: () => {},
      },
      {
        text: 'Sair',
        onPress: async () => {
          try {
            await signOut(auth);
          } catch (error) {
            Alert.alert('Erro', 'Erro ao sair do aplicativo');
          }
        },
      },
    ]);
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Expor método de refresh via ref
  useEffect(() => {
    if (ref) {
      (ref as any).current = { refresh: loadTransactions };
    }
  }, [loadTransactions, ref]);

  const getTodayDate = useCallback((): string => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return today.toLocaleDateString('pt-BR', options);
  }, []);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyTitle}>Nenhuma transação</Text>
      <Text style={styles.emptyText}>
        Comece a registrar suas transações clicando no botão +
      </Text>
    </View>
  ), []);

  const renderedSummaryCards = useMemo(() => (
    <>
      <SummaryCard
        title="Saldo Total"
        value={saldo}
        type="total"
        icon="💰"
      />
      <View style={styles.summaryRow}>
        <View style={styles.summaryHalf}>
          <SummaryCard
            title="Entradas"
            value={totalEntradas}
            type="entrada"
            icon="📥"
          />
        </View>
        <View style={styles.summaryHalf}>
          <SummaryCard
            title="Gastos"
            value={totalGastos}
            type="gasto"
            icon="📤"
          />
        </View>
      </View>
    </>
  ), [saldo, totalEntradas, totalGastos]);

  const renderHeader = useCallback(() => (
    <View>
      {/* Header com Logo e Logout */}
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.headerTitle}>💰 Meu Controle</Text>
          <Text style={styles.headerSubtitle}>Financeiro</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Saudação */}
      <View style={styles.greetingContainer}>
        <View>
          <Text style={styles.greeting}>Olá 👋</Text>
          <Text style={styles.name}>{user.email?.split('@')[0] || 'Usuário'}</Text>
          <Text style={styles.todayDate}>{getTodayDate()}</Text>
        </View>
      </View>

      {/* Resumo Financeiro */}
      <Text style={styles.sectionTitle}>Resumo Financeiro</Text>

      {renderedSummaryCards}

      {/* Transações */}
      <Text style={styles.sectionTitle}>Últimas Transações</Text>
    </View>
  ), [handleLogout, getTodayDate, user.email, renderedSummaryCards]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Carregando transações...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={transactions}
        renderItem={({ item }) => (
          <TransactionItem
            descricao={item.descricao}
            valor={item.valor}
            tipo={item.tipo}
            data={formatDate(item.data)}
          />
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        scrollEnabled={true}
        nestedScrollEnabled={true}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />

      {/* Botão Flutuante */}
      <TouchableOpacity style={styles.fab} onPress={onAddTransaction}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const FinancialHome = React.forwardRef(FinancialHomeComponent);

export default FinancialHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  greetingContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  todayDate: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  summaryHalf: {
    flex: 1,
    marginHorizontal: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTop: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFE5E5',
    borderRadius: 6,
  },
  logoutText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
