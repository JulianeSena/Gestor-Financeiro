import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { User } from 'firebase/auth';
import { collection, getDocs, limit, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../firebase';
import TransactionItem from '../components/TransactionItem';
import { TRANSACTION_CATEGORIES } from '../constants/transactionCategories';

type Transaction = {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'gasto';
  categoriaId: string;
  data: Timestamp;
};

type CategoriesScreenProps = {
  user?: User | null;
};

export default function CategoriesScreen({ user }: CategoriesScreenProps) {
  const navigation = useNavigation<any>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
        limit(200)
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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  }, [loadTransactions]);

  const handleOpenDrawer = useCallback(() => {
    navigation.openDrawer();
  }, [navigation]);

  const categoryCounts = useMemo(() => {
    return transactions.reduce<Record<string, number>>((accumulator, transaction) => {
      accumulator[transaction.categoriaId] = (accumulator[transaction.categoriaId] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [transactions]);

  const availableCategories = useMemo(() => {
    return TRANSACTION_CATEGORIES.filter((category) => (categoryCounts[category] ?? 0) > 0);
  }, [categoryCounts]);

  useEffect(() => {
    if (selectedCategory !== 'all' && !availableCategories.includes(selectedCategory as any)) {
      setSelectedCategory('all');
    }
  }, [availableCategories, selectedCategory]);

  const filteredTransactions = useMemo(() => {
    if (selectedCategory === 'all') {
      return transactions;
    }

    return transactions.filter((transaction) => transaction.categoriaId === selectedCategory);
  }, [selectedCategory, transactions]);

  const formatDate = useCallback((timestamp: Timestamp): string => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('pt-BR');
  }, []);

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TransactionItem
      descricao={item.descricao}
      valor={item.valor}
      tipo={item.tipo}
      data={formatDate(item.data)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleOpenDrawer} style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerTextBlock}>
          <Text style={styles.title}>Categorias</Text>
          <Text style={styles.subtitle}>
            {selectedCategory === 'all'
              ? 'Categorias existentes nas transações'
              : `Filtrando por ${selectedCategory}`}
          </Text>
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Categorias disponíveis</Text>
        <FlatList
          data={['all', ...availableCategories]}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            const count = item === 'all' ? transactions.length : categoryCounts[item] ?? 0;

            return (
              <TouchableOpacity
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {item === 'all' ? 'Todas' : item}
                </Text>
                <Text style={[styles.filterChipCount, isSelected && styles.filterChipCountActive]}>
                  {count}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Carregando transações...</Text>
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyTitle}>
            {selectedCategory === 'all'
              ? 'Nenhuma transação cadastrada'
              : 'Nenhuma transação nessa categoria'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {selectedCategory === 'all'
              ? 'Crie uma transação para começar a ver as categorias disponíveis.'
              : 'Escolha outra categoria ou cadastre novos lançamentos.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>Transações da categoria</Text>
              <Text style={styles.listHeaderSubtitle}>
                {filteredTransactions.length} registros encontrados
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#0f172a',
    fontWeight: '600',
  },
  headerTextBlock: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },
  filterSection: {
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterList: {
    paddingHorizontal: 16,
  },
  filterChip: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChipActive: {
    backgroundColor: '#16a34a',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterChipCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  filterChipCountActive: {
    color: '#16a34a',
  },
  listContent: {
    paddingBottom: 24,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  listHeaderSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
  },
});
