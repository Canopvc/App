import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, ScrollView, Alert, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from 'react-native-paper';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GEMINI_API_KEY = 'AIzaSyCcl_gknbXTYo1SulFaejZKnqI2ZrcX9mM';
const WORKOUTS_STORAGE_KEY = 'workouts';

// Tipos (mantendo consistência com sua página de criação)
type ExerciseType = 'calisthenics' | 'cardio' | 'weightlifting';

type Exercise = {
  id: string;
  name: string;
  type: ExerciseType;
  sets: number;
  reps?: number;
  weight?: number;
  minutes?: number;
  dropset: boolean;
  failure: boolean;
  warmup: boolean;
};

type Workout = {
  name: string;
  createdAt: string;
  exercises: Exercise[];
};

type MessageType = {
  text: string;
  isUser: boolean;
  timestamp: Date;
  isWorkout?: boolean;
  workoutData?: Workout;
};

function uid(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function App() {
  const theme = useTheme();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [workoutName, setWorkoutName] = useState('');

  // Função para extrair treino do texto da IA
  const extractWorkoutFromText = (text: string): Workout | null => {
    try {
      if (text.includes('Exercício:') && text.includes('Séries:') && text.includes('Repetições:')) {
        const exercises: Exercise[] = [];
        let currentWorkoutName = 'Treino Gerado pela IA';
        
        const workoutNameMatch = text.match(/Treino:\s*([^\n]+)/i);
        if (workoutNameMatch) {
          currentWorkoutName = workoutNameMatch[1].trim();
        }

        const exerciseBlocks = text.split(/Exercício:\s*/i).slice(1);
        
        for (const block of exerciseBlocks) {
          const exercise: Partial<Exercise> = {};
          
          const nameMatch = block.match(/^([^\n]+)/);
          if (nameMatch) exercise.name = nameMatch[1].trim();
          
          const setsMatch = block.match(/Séries:\s*(\d+)/i);
          if (setsMatch) exercise.sets = parseInt(setsMatch[1]);
          
          const repsMatch = block.match(/Repetições:\s*(\d+)/i);
          if (repsMatch) exercise.reps = parseInt(repsMatch[1]);
          
          const weightMatch = block.match(/Peso:\s*(\d+)/i);
          if (weightMatch) exercise.weight = parseInt(weightMatch[1]);
          
          const minutesMatch = block.match(/Duração:\s*(\d+)/i);
          if (minutesMatch) exercise.minutes = parseInt(minutesMatch[1]);
          
          const typeMatch = block.match(/Tipo:\s*(weightlifting|calisthenics|cardio)/i);
          if (typeMatch) exercise.type = typeMatch[1].toLowerCase() as ExerciseType;

          if (exercise.name) {
            exercises.push({
              id: uid('ex-'),
              name: exercise.name,
              type: exercise.type || 'weightlifting',
              sets: exercise.sets || 3,
              reps: exercise.reps,
              weight: exercise.weight,
              minutes: exercise.minutes,
              dropset: false,
              failure: false,
              warmup: false,
            });
          }
        }

        if (exercises.length > 0) {
          return {
            name: currentWorkoutName,
            createdAt: new Date().toISOString(),
            exercises
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Erro ao extrair treino:', error);
      return null;
    }
  };

  const handleGenerateResponse = async () => {
    if (!prompt) {
      Alert.alert('Erro', 'Por favor, insira um texto.');
      return;
    }

    const userMessage: MessageType = {
      text: prompt,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
      
      const systemInstruction = `Você é um assistente virtual de fitness. Siga estas regras SEMPRE:

1) Quando o usuário pedir um treino, plano de treino, rotina, programa, ou algo que envolva exercícios, ALÉM das explicações, forneça ao final um bloco ESTRUTURADO em português exatamente neste formato (sem usar markdown ou blocos de código):

Treino: <nome do treino>
Exercício: <nome do exercício>
Séries: <número inteiro>
Repetições: <número inteiro>
Peso: <número inteiro em kg, 0 se não se aplica>
Duração: <número inteiro em minutos, 0 se não se aplica>
Tipo: <weightlifting|calisthenics|cardio>

Exercício: <nome do exercício 2>
Séries: <número inteiro>
Repetições: <número inteiro>
Peso: <número inteiro em kg, 0 se não se aplica>
Duração: <número inteiro em minutos, 0 se não se aplica>
Tipo: <weightlifting|calisthenics|cardio>

… (repita para todos os exercícios)

2) Use exatamente estes rótulos com acentos e pontuação: "Treino:", "Exercício:", "Séries:", "Repetições:", "Peso:", "Duração:", "Tipo:".
3) Sempre inclua as linhas "Séries:" e "Repetições:" (use 0 se não se aplica). "Peso:" e "Duração:" também devem estar presentes, com 0 quando não se aplicarem.
4) O campo "Tipo:" DEVE ser exatamente um destes valores em minúsculas: weightlifting, calisthenics, cardio.
5) Não envolva o bloco estruturado em listas, markdown, ou código. Apenas texto puro como mostrado acima.
6) Se o usuário NÃO estiver pedindo um plano/treino, responda normalmente sem incluir o bloco estruturado.
7) Seja conciso nas explicações antes do bloco estruturado.`;

      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.isUser ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const requestBody = {
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          ...conversationHistory,
          { role: 'user', parts: [{ text: prompt }] }
        ],
      };

      const res = await axios.post(apiUrl, requestBody, {
        headers: { 'Content-Type': 'application/json' },
      });

      const generatedText = res.data.candidates[0].content.parts[0].text;
      const workoutData = extractWorkoutFromText(generatedText);
      
      const botMessage: MessageType = {
        text: generatedText,
        isUser: false,
        timestamp: new Date(),
        isWorkout: !!workoutData,
        workoutData: workoutData || undefined
      };
      
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Erro ao chamar a API do Gemini:', error);
      Alert.alert('Erro', 'Falha ao obter uma resposta do modelo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkout = async () => {
    if (!selectedWorkout || !workoutName.trim()) {
      Alert.alert('Erro', 'Por favor, insira um nome para o treino.');
      return;
    }

    setSavingWorkout(true);
    try {
      const workoutToSave: Workout = {
        ...selectedWorkout,
        name: workoutName.trim(),
        createdAt: new Date().toISOString()
      };

      const raw = await AsyncStorage.getItem(WORKOUTS_STORAGE_KEY);
      const list: Workout[] = raw ? JSON.parse(raw) : [];
      list.unshift(workoutToSave);
      await AsyncStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(list));
      
      Alert.alert('Sucesso', 'Treino salvo com sucesso!');
      setSelectedWorkout(null);
      setWorkoutName('');
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
      Alert.alert('Erro', 'Não foi possível salvar o treino.');
    } finally {
      setSavingWorkout(false);
    }
  };

  const renderMessages = () => {
    return messages.map((msg, index) => (
      <View key={index}>
        <TouchableOpacity 
          style={[
            styles.message, 
            msg.isUser ? styles.userMessage : styles.geminiMessage
          ]}
        >
          {!msg.isUser && <FontAwesome6 name="robot" size={22} color="#9333ea" />}
          {msg.isUser && <FontAwesome name="user" size={22} color="#0ea5e9" />}
          
          <View style={styles.messageBubble}>
            <Text style={[
              styles.messageText,
              { color: theme.colors.onSurface },
              msg.isUser ? styles.userMessageText : styles.geminiMessageText
            ]}>
              {msg.text}
            </Text>
            <Text style={styles.timestamp}>
              {msg.timestamp.toLocaleTimeString()}
            </Text>
          </View>
        </TouchableOpacity>

        {msg.isWorkout && msg.workoutData !== undefined && (
          <TouchableOpacity 
            style={styles.saveWorkoutButton}
            onPress={() => {
              if (msg.workoutData) {
                setSelectedWorkout(msg.workoutData);
                setWorkoutName(msg.workoutData.name);
              }
            }}
          >
            <Text style={styles.saveWorkoutButtonText}>💾 Salvar este Treino</Text>
          </TouchableOpacity>
        )}
      </View>
    ));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.onBackground }]}>💪 Gemini Fitness Chat</Text>
      
      <ScrollView style={styles.messagesContainer} contentContainerStyle={{ paddingBottom: 20 }}>
        {renderMessages()}
        {loading && <ActivityIndicator style={styles.loading} size="large" color={theme.colors.primary} />}
      </ScrollView>

      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline, borderWidth: 1 }] }>
        <TextInput
          style={[styles.input, { color: theme.colors.onSurface }]}
          placeholder="Pergunte sobre exercícios..."
          placeholderTextColor={theme.colors.onSurfaceVariant ?? theme.colors.onSurface}
          value={prompt}
          onChangeText={setPrompt}
          multiline
        />
        <TouchableOpacity 
          onPress={handleGenerateResponse} 
          style={styles.sendButton}
          disabled={loading}
        >
          <MaterialCommunityIcons name="send-circle" size={40} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <Modal visible={!!selectedWorkout} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Salvar Treino</Text>
            
            <Text style={[styles.label, { color: theme.colors.onSurface }]}>Nome do Treino</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.colors.surface, color: theme.colors.onSurface, borderColor: theme.colors.outline }]}
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="Ex: Treino de Peito"
              placeholderTextColor={theme.colors.onSurfaceVariant ?? theme.colors.onSurface}
            />

            <Text style={[styles.label, { color: theme.colors.onSurface }]}>Exercícios incluídos:</Text>
            <ScrollView style={styles.exercisesList}>
              {selectedWorkout?.exercises.map((exercise, index) => (
                <Text key={index} style={[styles.exerciseText, { color: theme.colors.onSurface }] }>
                  • {exercise.name} ({exercise.sets} séries de {exercise.reps} reps)
                </Text>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setSelectedWorkout(null)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, [styles.saveButton, { backgroundColor: theme.colors.primary }]]}
                onPress={handleSaveWorkout}
                disabled={savingWorkout}
              >
                {savingWorkout ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  messagesContainer: {
    flex: 1,
  },
  message: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    marginVertical: 6,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userMessage: { alignSelf: 'flex-end', backgroundColor: 'rgba(14,165,233,0.12)' },
  geminiMessage: { alignSelf: 'flex-start', backgroundColor: 'rgba(147,51,234,0.12)' },
  messageBubble: {
    flexShrink: 1,
    marginLeft: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {},
  geminiMessageText: {},
  timestamp: {
    fontSize: 12,
    color: '#64748b',
    paddingTop: 5,
    alignSelf: 'flex-end',
  },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 30, paddingHorizontal: 15, paddingVertical: 8, marginTop: 8 },
  input: {
    flex: 1,
    fontSize: 16,
    minHeight: 45,
  },
  sendButton: {
    marginLeft: 8,
  },
  loading: {
    marginVertical: 10,
  },
  saveWorkoutButton: { backgroundColor: '#22c55e', padding: 10, borderRadius: 10, marginVertical: 5, alignSelf: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  saveWorkoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: { padding: 20, borderRadius: 16, width: '90%', maxHeight: '80%' },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '600',
  },
  modalInput: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  exercisesList: {
    maxHeight: 150,
    marginBottom: 15,
  },
  exerciseText: {
    fontSize: 15,
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 14,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#94a3b8',
  },
  saveButton: {
    backgroundColor: '#0ea5e9',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
