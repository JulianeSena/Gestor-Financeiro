import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface SummaryCardProps {
  title: string;
  value: number;
  type: 'total' | 'entrada' | 'gasto';
  icon: string;
}

function SummaryCardComponent({ title, value, type, icon }: SummaryCardProps) {
  const colors = {
    total: { bg: '#E3F2FD', text: '#1976D2' },
    entrada: { bg: '#E8F5E9', text: '#4CAF50' },
    gasto: { bg: '#FFEBEE', text: '#F44336' },
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const selectedColor = colors[type];

  return (
    <View style={[styles.container, { backgroundColor: selectedColor.bg }]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={[styles.value, { color: selectedColor.text }]}>
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

const SummaryCard = React.memo(SummaryCardComponent);

export default SummaryCard;

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 28,
  },
});
