import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { TRANSACTION_CATEGORIES } from '../constants/transactionCategories';

interface EditTransactionScreenProps {
  user: any;
  transaction: any;
  onBack: () => void;
  onSuccess: () => void;
}

export default function EditTransactionScreen({
  user,
  transaction,
  onBack,
  onSuccess,
}: EditTransactionScreenProps) {
  const [descricao, setDescricao] = useState(transaction.descricao);
  const [valor, setValor] = useState(transaction.valor.toString());
  const [categoria, setCategoria] = useState(transaction.categoriaId);
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!descricao.trim()) {
      Alert.alert('Erro', 'Por favor, descreva a transação');
      return false;
    }

    if (!valor.trim()) {
      Alert.alert('Erro', 'Por favor, insira um valor');
      return false;
    }

    const numericValue = parseFloat(valor.replace(',', '.'));
    if (isNaN(numericValue) || numericValue <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido');
      return false;
    }

    if (!categoria) {
      Alert.alert('Erro', 'Por favor, selecione uma categoria');
      return false;
    }

    return true;
  };

  const handleUpdateTransaction = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const numericValue = parseFloat(valor.replace(',', '.'));
      const transactionRef = doc(db, 'transacoes', transaction.id);

      await updateDoc(transactionRef, {
        descricao: descricao.trim(),
        valor: numericValue,
        categoriaId: categoria,
        atualizadoEm: Timestamp.now(),
      });

      Alert.alert('Sucesso', 'Transação atualizada com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            onSuccess();
          },
        },
      ]);
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a transação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} disabled={loading}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Editar Transação</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tipo de Transação (somente leitura) */}
        <View style={styles.section}>
          <Text style={styles.label}>Tipo</Text>
          <View style={styles.typeContainer}>
            <View style={[styles.typeButtonReadonly, { flex: 1 }]}>
              <Text style={styles.typeButtonText}>
                {transaction.tipo === 'entrada' ? '📥 Entrada' : '📤 Gasto'}
              </Text>
            </View>
          </View>
          <Text style={styles.hint}>Tipo não pode ser alterado</Text>
        </View>

        {/* Descrição */}
        <View style={styles.section}>
          <Text style={styles.label}>Descrição *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Compras no mercado"
            value={descricao}
            onChangeText={setDescricao}
            editable={!loading}
            placeholderTextColor="#CCC"
          />
        </View>

        {/* Valor */}
        <View style={styles.section}>
          <Text style={styles.label}>Valor *</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.valueInput}
              placeholder="0,00"
              value={valor}
              onChangeText={setValor}
              keyboardType="decimal-pad"
              editable={!loading}
              placeholderTextColor="#CCC"
            />
          </View>
        </View>

        {/* Categoria */}
        <View style={styles.section}>
          <Text style={styles.label}>Categoria *</Text>
          <View style={styles.categoryContainer}>
            {TRANSACTION_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  categoria === cat && styles.categoryButtonActive,
                ]}
                onPress={() => setCategoria(cat)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.categoryText,
                    categoria === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botão de Atualizar */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleUpdateTransaction}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Atualizar Transação</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onBack}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
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
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButtonReadonly: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginRight: 4,
  },
  valueInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#fff',
  },
  categoryButtonActive: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#1976D2',
  },
  saveButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
    marginBottom: 32,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});
