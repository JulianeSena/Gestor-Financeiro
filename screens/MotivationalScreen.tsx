import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface MotivationalScreenProps {
  onBack?: () => void;
}

const motivationalPhrases = [
  'Cada transação é um passo para o sucesso financeiro! 💪',
  'Controle seu dinheiro e liberte seu futuro! 🚀',
  'Pequenos passos levam a grandes mudanças! ✨',
  'Você é capaz de alcançar seus objetivos financeiros! 🎯',
  'Organize seu dinheiro, organize sua vida! 📊',
  'A consistência é a chave do sucesso! 🔑',
  'Cada gasto consciente é um voto no seu futuro! 💰',
  'Você está no caminho certo! Continue assim! 🌟',
  'Economizar é um superpower! 💎',
  'Seu futuro agradece cada ação de hoje! 🙏',
];

export default function MotivationalScreen({ onBack }: MotivationalScreenProps) {
  const navigation = useNavigation<any>();
  const [currentPhrase, setCurrentPhrase] = useState(motivationalPhrases[0]);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => {
        const nextIndex = (prev + 1) % motivationalPhrases.length;
        setCurrentPhrase(motivationalPhrases[nextIndex]);
        return nextIndex;
      });
    }, 5000); // 5s

    return () => clearInterval(interval);
  }, []);

  const handleNextPhrase = () => {
    const nextIndex = (phraseIndex + 1) % motivationalPhrases.length;
    setPhraseIndex(nextIndex);
    setCurrentPhrase(motivationalPhrases[nextIndex]);
  };

  const handlePreviousPhrase = () => {
    const prevIndex = (phraseIndex - 1 + motivationalPhrases.length) % motivationalPhrases.length;
    setPhraseIndex(prevIndex);
    setCurrentPhrase(motivationalPhrases[prevIndex]);
  };

  const handleOpenDrawer = () => {
    navigation.openDrawer();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleOpenDrawer}>
          <Text style={styles.backButton}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Motivação Diária</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {}
        <View style={styles.gifContainer}>
          <Image
            source={require('../assets/midia/Sonic The Hedgehog Sonic Sticker - Sonic The Hedgehog Sonic Sprite - Discover & Share GIFs.gif')}
            style={styles.gif}
          />
        </View>


        <View style={styles.phraseContainer}>
          <Text style={styles.phraseText}>{currentPhrase}</Text>
        </View>

        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePreviousPhrase}
          >
            <Text style={styles.navButtonText}>← Anterior</Text>
          </TouchableOpacity>

          <Text style={styles.phraseCounter}>
            {phraseIndex + 1} / {motivationalPhrases.length}
          </Text>

          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNextPhrase}
          >
            <Text style={styles.navButtonText}>Próxima →</Text>
          </TouchableOpacity>
        </View>


        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Todas as Frases:</Text>
          {motivationalPhrases.map((phrase, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.phraseItem,
                index === phraseIndex && styles.phraseItemActive,
              ]}
              onPress={() => {
                setPhraseIndex(index);
                setCurrentPhrase(phrase);
              }}
            >
              <Text style={styles.phraseItemNumber}>{index + 1}.</Text>
              <Text
                style={[
                  styles.phraseItemText,
                  index === phraseIndex && styles.phraseItemTextActive,
                ]}
              >
                {phrase}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
  gifContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  gif: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
  },
  phraseContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  phraseText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    lineHeight: 28,
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  phraseCounter: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    minWidth: 50,
    textAlign: 'center',
  },
  listContainer: {
    marginBottom: 24,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  phraseItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
  },
  phraseItemActive: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: '#1976D2',
  },
  phraseItemNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginRight: 8,
    minWidth: 20,
  },
  phraseItemText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  phraseItemTextActive: {
    color: '#1976D2',
    fontWeight: '600',
  },
});
