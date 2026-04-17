import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

interface TransactionItemProps {
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'gasto';
  data: string;
  onPress?: () => void;
}

function TransactionItemComponent({
  descricao,
  valor,
  tipo,
  data,
  onPress,
}: TransactionItemProps) {
  const isEntrada = tipo === 'entrada';
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(amount));
  };

  const formattedValue = formatCurrency(valor);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftContent}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: isEntrada ? '#E8F5E9' : '#FFEBEE' },
          ]}
        >
          <Text style={[styles.icon, { color: isEntrada ? '#4CAF50' : '#F44336' }]}>
            {isEntrada ? '📥' : '📤'}
          </Text>
        </View>
        <View style={styles.textContent}>
          <Text style={styles.description} numberOfLines={1}>
            {descricao}
          </Text>
          <Text style={styles.date}>{data}</Text>
        </View>
      </View>

      <Text
        style={[
          styles.value,
          { color: isEntrada ? '#4CAF50' : '#F44336' },
        ]}
      >
        {isEntrada ? '+' : '-'}{formattedValue}
      </Text>
    </TouchableOpacity>
  );
}

const TransactionItem = React.memo(TransactionItemComponent);

export default TransactionItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  textContent: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});
