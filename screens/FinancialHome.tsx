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
import { useNavigation } from '@react-navigation/native';
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
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transaction: Transaction) => void;
}

interface FinancialHomeRef {
  refresh: () => Promise<void>;
}

function FinancialHomeComponent(
  { user, onAddTransaction, onEditTransaction, onDeleteTransaction }: FinancialHomeProps,
  ref: React.ForwardedRef<FinancialHomeRef>
) {
  const navigation = useNavigation<any>();
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

  const isSameDay = useCallback((date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }, []);

  const filteredTransactions = useMemo(() => transactions, [transactions]);

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

  const handleOpenDrawer = useCallback(() => {
    navigation.openDrawer();
  }, [navigation]);

  const handleOpenTransactionsList = useCallback(() => {
    navigation.navigate('TransactionsList');
  }, [navigation]);

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
        <TouchableOpacity onPress={handleOpenDrawer} style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Meu Controle Financeiro</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickMenuContainer}>
        <Text style={styles.quickMenuTitle}>Menu rápido</Text>

        <View style={styles.quickMenuRow}>
          <TouchableOpacity style={styles.quickMenuCard} onPress={onAddTransaction}>
            <Text style={styles.quickMenuIcon}>＋</Text>
            <Text style={styles.quickMenuLabel}>Nova transação</Text>
            <Text style={styles.quickMenuDescription}>Cadastrar entrada ou gasto</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickMenuCard} onPress={handleOpenTransactionsList}>
            <Text style={styles.quickMenuIcon}>📋</Text>
            <Text style={styles.quickMenuLabel}>Todas as transações</Text>
            <Text style={styles.quickMenuDescription}>Abrir a lista completa</Text>
          </TouchableOpacity>
        </View>
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
  ), [handleLogout, getTodayDate, user.email, renderedSummaryCards, navigation, onAddTransaction, handleOpenTransactionsList]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Carregando transações...</Text>
      </View>
    );
  }

  return (
    <>
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={filteredTransactions}
        renderItem={({ item }) => (
          <TransactionItem
            descricao={item.descricao}
            valor={item.valor}
            tipo={item.tipo}
            data={formatDate(item.data)}
            onPress={() => {
              if (onEditTransaction || onDeleteTransaction) {
                Alert.alert('Transação', 'O que deseja fazer?', [
                  {
                    text: 'Editar',
                    onPress: () => onEditTransaction?.(item),
                  },
                  {
                    text: 'Deletar',
                    onPress: () => {
                      Alert.alert('Deletar', 'Tem certeza que deseja deletar esta transação?', [
                        { text: 'Cancelar', onPress: () => {} },
                        {
                          text: 'Deletar',
                          onPress: () => onDeleteTransaction?.(item),
                          style: 'destructive',
                        },
                      ]);
                    },
                  },
                  { text: 'Cancelar', onPress: () => {} },
                ]);
              }
            }}
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
    </>
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
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  headerTop: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    lineHeight: 28,
  },
  menuButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
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
  quickMenuContainer: {
    backgroundColor: '#F4F8FF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4ECF7',
  },
  quickMenuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  quickMenuRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickMenuCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DDE7F5',
  },
  quickMenuIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  quickMenuLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  quickMenuDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
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
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1976D2',
    marginRight: 8,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    textAlign: 'center',
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 18,
    color: '#F44336',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#1976D2',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
