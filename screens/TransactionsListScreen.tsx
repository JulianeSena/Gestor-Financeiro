import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, limit, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../firebase';
import TransactionItem from '../components/TransactionItem';
import { useMemo } from 'react';

type Transaction = {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'gasto';
  categoriaId: string;
  data: Timestamp;
};

type TransactionsListScreenProps = {
  user: any;
};

export default function TransactionsListScreen({ user }: TransactionsListScreenProps) {
  const navigation = useNavigation<any>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateInput, setDateInput] = useState('');

  const formatDate = useCallback((timestamp: Timestamp): string => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('pt-BR');
  }, []);

  const isSameDay = useCallback((date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!selectedDate) {
      return transactions;
    }

    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.data.seconds * 1000);
      return isSameDay(transactionDate, selectedDate);
    });
  }, [transactions, selectedDate, isSameDay]);

  const loadTransactions = useCallback(async () => {
    if (!user?.uid) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const transactionQuery = query(
        collection(db, 'transacoes'),
        where('userId', '==', user.uid),
        orderBy('data', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(transactionQuery);
      const loaded = snapshot.docs.map((transactionDoc) => ({
        id: transactionDoc.id,
        ...transactionDoc.data(),
      })) as Transaction[];

      setTransactions(loaded);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  }, [loadTransactions]);

  const handleClearDateFilter = useCallback(() => {
    setSelectedDate(null);
  }, []);

  const handleSelectDate = useCallback(() => {
    const currentDate = selectedDate || new Date();
    const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;
    setDateInput(formattedDate);
    setShowDateModal(true);
  }, [selectedDate]);

  const handleConfirmDate = useCallback(() => {
    if (dateInput.trim()) {
      const parts = dateInput.split('/');

      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const newDate = new Date(year, month, day);

        if (!isNaN(newDate.getTime()) && day > 0 && day <= 31 && month >= 0 && month <= 11) {
          setSelectedDate(newDate);
          setShowDateModal(false);
          setDateInput('');
        } else {
          Alert.alert('Erro', 'Data inválida. Use o formato DD/MM/YYYY');
        }
      } else {
        Alert.alert('Erro', 'Formato de data inválido. Use DD/MM/YYYY');
      }
    }
  }, [dateInput]);

  const handleCancelDateModal = useCallback(() => {
    setShowDateModal(false);
    setDateInput('');
  }, []);

  const handleOpenDrawer = useCallback(() => {
    navigation.openDrawer();
  }, [navigation]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>
        {selectedDate ? 'Nenhuma transação para a data selecionada' : 'Nenhuma transação encontrada'}
      </Text>
      <Text style={styles.emptyText}>
        {selectedDate
          ? 'Tente outra data ou limpe o filtro para ver todos os lançamentos.'
          : 'Quando você criar lançamentos, eles vão aparecer aqui.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleOpenDrawer} style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        <View style={styles.headerTextBlock}>
          <Text style={styles.title}>Todas as transações</Text>
          <Text style={styles.subtitle}>{filteredTransactions.length} registros encontrados</Text>
        </View>
      </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.dateButton} onPress={handleSelectDate}>
            <Text style={styles.dateButtonText}>
              📅 {selectedDate ? `${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}` : 'Filtrar por data'}
            </Text>
          </TouchableOpacity>

          {selectedDate && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearDateFilter}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Carregando transações...</Text>
        </View>
      ) : (
        <FlatList
            data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionItem
              descricao={item.descricao}
              valor={item.valor}
              tipo={item.tipo}
              data={formatDate(item.data)}
            />
          )}
          ListEmptyComponent={renderEmptyState}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={filteredTransactions.length === 0 ? styles.emptyList : styles.listContent}
        />
      )}

      <Modal
        visible={showDateModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDateModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar por Data</Text>
            <Text style={styles.modalSubtitle}>Digite a data no formato DD/MM/YYYY</Text>

            <TextInput
              style={styles.dateInput}
              placeholder="DD/MM/YYYY"
              value={dateInput}
              onChangeText={setDateInput}
              placeholderTextColor="#CCC"
              maxLength={10}
            />

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelDateModal}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmDate}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
  },
  headerTextBlock: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
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
    color: '#1976D2',
    fontWeight: '600',
    textAlign: 'center',
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#F44336',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: '#1976D2',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
