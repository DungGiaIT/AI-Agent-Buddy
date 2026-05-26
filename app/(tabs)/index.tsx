import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { 
  getRoadmap, 
  saveRoadmap, 
  getSettings, 
  getStreak, 
  checkAndUpdateStreak, 
  evaluateFeynmanSummary, 
  DayTask,
  AppSettings
} from '@/services/study-store';

export default function HomeScreen() {
  const colors = useTheme();

  const [roadmap, setRoadmap] = useState<DayTask[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Timer States (30 minutes)
  const [timerSeconds, setTimerSeconds] = useState(30 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<any>(null);

  // Feynman States
  const [feynmanText, setFeynmanText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    feedback: string;
    success: boolean;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadHomeScreenData();
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [])
  );

  const loadHomeScreenData = async () => {
    try {
      const storedRoadmap = await getRoadmap();
      setRoadmap(storedRoadmap);

      const config = await getSettings();
      setSettings(config);

      // Verify and fetch Streak
      const activeStreak = await checkAndUpdateStreak(false);
      setStreak(activeStreak);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Timer logic
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerActive(false);
            Alert.alert('⏱️ Hết Giờ!', 'Bạn đã hoàn thành 30 phút học tập tập trung! Hãy tóm tắt lại kiến thức dưới đây.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  const handleStartPauseTimer = () => {
    setTimerActive(!timerActive);
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setTimerSeconds(30 * 60);
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Submit Feynman Summary
  const handleSubmitFeynman = async (todayTask: DayTask) => {
    if (!feynmanText.trim()) {
      Alert.alert('Nhắc nhở', 'Vui lòng nhập tóm tắt Feynman của bạn.');
      return;
    }

    // Đã bỏ yêu cầu kiểm tra API Key từ phía User do dùng Proxy Backend

    setIsSubmitting(true);
    try {
      const result = await evaluateFeynmanSummary(
        feynmanText,
        todayTask.title,
        todayTask.concept,
        settings.apiKey,
        settings.tone || 'friendly'
      );

      if (result.success) {
        // 1. Mark task as completed
        const updatedRoadmap = roadmap.map((item) => {
          if (item.day === todayTask.day) {
            return {
              ...item,
              done: true,
              feynmanSummary: feynmanText,
              feynmanScore: result.rating,
              feynmanFeedback: result.feedback,
            };
          }
          return item;
        });

        await saveRoadmap(updatedRoadmap);
        setRoadmap(updatedRoadmap);

        // 2. Increment streak
        const newStreak = await checkAndUpdateStreak(true);
        setStreak(newStreak);

        setEvaluationResult({
          score: result.rating,
          feedback: result.feedback,
          success: true,
        });

        Alert.alert('Chúc mừng! 🎉', `Bạn đã hoàn thành Ngày ${todayTask.day} học tập! Điểm Feynman: ${result.rating}/10`);
      } else {
        // Didn't pass
        setEvaluationResult({
          score: result.rating,
          feedback: result.feedback,
          success: false,
        });
        Alert.alert('Cố lên! 💪', `Tóm tắt của bạn đạt ${result.rating}/10 điểm. Hãy hoàn thiện thêm để vượt qua thử thách.`);
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Lỗi đánh giá', e?.message || 'Không thể liên lạc với Gemini API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  // Find the first uncompleted task of the day
  const todayTask = roadmap.find((item) => !item.done);
  const allCompleted = roadmap.length > 0 && roadmap.every((item) => item.done);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Streak Header */}
          <ThemedView style={[styles.streakHeaderCard, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
            <View style={styles.streakLeft}>
              <ThemedText type="smallBold" style={[styles.streakLabel, { color: colors.textSecondary }]}>
                CHUỖI KỶ LUẬT
              </ThemedText>
              <ThemedText type="subtitle" style={[styles.streakText, { color: colors.accent }]}>
                {streak} ngày học liên tiếp
              </ThemedText>
            </View>
            <ThemedView type="backgroundSelected" style={styles.streakFlameContainer}>
              <ThemedText type="subtitle" style={styles.flameEmoji}>
                {streak > 0 ? '🔥' : '🌱'}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Quick Start Guide */}
          {roadmap.length === 0 && (
            <ThemedView style={[styles.card, { borderColor: colors.border, padding: 20, marginTop: 16, backgroundColor: colors.backgroundSelected }]}>
              <ThemedText type="subtitle" style={{ color: colors.accent, marginBottom: 8 }}>📖 Hướng dẫn nhanh</ThemedText>
              <ThemedText type="small" style={{ color: colors.text, marginBottom: 4, fontWeight: 'bold' }}>1️⃣ Thiết lập lộ trình 7 ngày</ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary, marginBottom: 12, marginLeft: 24 }}>Chuyển sang tab Roadmap để tạo lộ trình học tập.</ThemedText>
              
              <ThemedText type="small" style={{ color: colors.text, marginBottom: 4, fontWeight: 'bold' }}>2️⃣ Bấm Bắt đầu & Học tập trung</ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary, marginBottom: 12, marginLeft: 24 }}>Quay lại đây mỗi ngày để hoàn thành 1 phiên 30 phút.</ThemedText>
              
              <ThemedText type="small" style={{ color: colors.text, marginBottom: 4, fontWeight: 'bold' }}>3️⃣ Nộp bài Feynman</ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary, marginLeft: 24 }}>Viết tóm tắt bằng ngôn từ của bạn. AI sẽ chấm điểm!</ThemedText>
            </ThemedView>
          )}

          {/* Goal Not Set / No Roadmap Empty State */}
          {roadmap.length === 0 ? (
            <ThemedView style={[styles.card, { borderColor: colors.border, padding: 24, alignItems: 'center' }]}>
              <ThemedText type="subtitle" style={styles.emptyTitle}>👋 Chào mừng bạn!</ThemedText>
              <ThemedText type="small" style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Để bắt đầu hành trình diệt trì hoãn, hãy chuyển sang tab **Roadmap** hoặc **Settings** để cấu hình API Key và thiết lập mục tiêu học tập 7 ngày của bạn nhé!
              </ThemedText>
            </ThemedView>
          ) : allCompleted ? (
            /* All completed celebration state */
            <ThemedView style={[styles.card, { borderColor: colors.border, padding: 24, alignItems: 'center', backgroundColor: colors.backgroundSelected }]}>
              <ThemedText type="subtitle" style={styles.congratsEmoji}>🏆</ThemedText>
              <ThemedText type="default" style={[styles.congratsTitle, { color: colors.accent }]}>
                XUẤT SẮC HOÀN THÀNH 7 NGÀY!
              </ThemedText>
              <ThemedText type="small" style={{ textAlign: 'center', color: colors.text, marginTop: 8 }}>
                Chúc mừng bạn đã rèn luyện kỷ luật vượt bậc, vượt qua sự trì hoãn thành công! Bạn có thể nhấn nút Tạo lại lộ trình ở tab Roadmap để bắt đầu mục tiêu tiếp theo.
              </ThemedText>
            </ThemedView>
          ) : todayTask ? (
            /* Active Day Task View */
            <View style={styles.activeContainer}>
              {/* Daily Task Card */}
              <ThemedView style={[styles.card, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
                <View style={styles.taskCardHeader}>
                  <ThemedText type="smallBold" style={[styles.dayLabel, { backgroundColor: colors.primary, color: '#ffffff' }]}>
                    Ngày {todayTask.day} / 7
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.textSecondary }}>
                    Học tập trung 30 phút
                  </ThemedText>
                </View>

                <ThemedText type="default" style={[styles.taskTitle, { color: colors.text }]}>
                  {todayTask.title}
                </ThemedText>

                {/* Subtasks List */}
                <View style={styles.subtasksContainer}>
                  {todayTask.subtasks.map((sub, idx) => (
                    <View key={idx} style={styles.subtaskRow}>
                      <ThemedText type="small" style={{ color: colors.primary, marginRight: 8 }}>✓</ThemedText>
                      <ThemedText type="small" style={{ color: colors.text, flex: 1 }}>{sub}</ThemedText>
                    </View>
                  ))}
                </View>

                {/* Countdown Timer */}
                <ThemedView type="backgroundSelected" style={styles.timerCard}>
                  <ThemedText type="subtitle" style={[styles.timerText, { color: colors.text }]}>
                    {formatTimer(timerSeconds)}
                  </ThemedText>
                  <View style={styles.timerButtons}>
                    <Pressable
                      onPress={handleStartPauseTimer}
                      style={[styles.timerBtn, { backgroundColor: colors.primary }]}
                    >
                      <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
                        {timerActive ? 'Tạm Dừng ⏸️' : 'Bắt Đầu ▶️'}
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={handleResetTimer}
                      style={[styles.timerBtnSecondary, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}
                    >
                      <ThemedText type="smallBold" style={{ color: colors.text }}>
                        Đặt lại 🔄
                      </ThemedText>
                    </Pressable>
                  </View>
                </ThemedView>
              </ThemedView>

              {/* Feynman Section */}
              <ThemedView style={[styles.card, { borderColor: colors.border, marginTop: 16, backgroundColor: colors.backgroundElement }]}>
                <ThemedText type="smallBold" style={[styles.feynmanTitle, { color: colors.accent }]}>
                  💡 PHƯƠNG PHÁP FEYNMAN (AI TỰ ĐỘNG CHẤM)
                </ThemedText>
                <ThemedText type="small" style={[styles.feynmanDesc, { color: colors.textSecondary }]}>
                  Để được xác nhận hoàn thành ngày học, hãy giải thích khái niệm dưới đây bằng ngôn từ đơn giản của riêng bạn:
                </ThemedText>

                <ThemedView type="backgroundSelected" style={styles.conceptBox}>
                  <ThemedText type="smallBold" style={{ color: colors.accent, marginBottom: 2 }}>
                    Khái niệm cần giải thích:
                  </ThemedText>
                  <ThemedText type="small" style={{ color: colors.text, fontWeight: 'bold' }}>
                    "{todayTask.concept}"
                  </ThemedText>
                </ThemedView>

                <TextInput
                  style={[styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  placeholder="Hãy viết 2-3 câu giải thích theo cách hiểu của bạn..."
                  placeholderTextColor={colors.textSecondary}
                  multiline={true}
                  numberOfLines={4}
                  value={feynmanText}
                  onChangeText={setFeynmanText}
                />

                <Pressable
                  onPress={() => handleSubmitFeynman(todayTask)}
                  disabled={isSubmitting}
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <ThemedText type="default" style={styles.buttonText}>
                      Nộp tóm tắt & Chấm điểm 🎓
                    </ThemedText>
                  )}
                </Pressable>

                {/* Evaluation Results display */}
                {evaluationResult && (
                  <ThemedView 
                    style={[
                      styles.evalResultBox, 
                      { 
                        backgroundColor: evaluationResult.success ? '#F0FDF4' : '#FEF2F2',
                        borderColor: evaluationResult.success ? '#DCFCE7' : '#FEE2E2'
                      }
                    ]}
                  >
                    <ThemedText 
                      type="smallBold" 
                      style={{ color: evaluationResult.success ? colors.accent : '#DC2626' }}
                    >
                      {evaluationResult.success ? '✓ ĐẠT YÊU CẦU' : '✗ CHƯA ĐẠT YÊU CẦU'} | Điểm: {evaluationResult.score}/10
                    </ThemedText>
                    <ThemedText type="small" style={[styles.evalFeedback, { color: colors.text }]}>
                      "{evaluationResult.feedback}"
                    </ThemedText>
                  </ThemedView>
                )}
              </ThemedView>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakHeaderCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  streakLeft: {
    flexDirection: 'column',
  },
  streakLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  streakText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  streakFlameContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flameEmoji: {
    fontSize: 22,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'transparent',
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  activeContainer: {
    flex: 1,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
    marginBottom: 12,
  },
  subtasksContainer: {
    gap: 8,
    marginBottom: 16,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  timerBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerBtnSecondary: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  feynmanTitle: {
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  feynmanDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  conceptBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: '#F8FAFC',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  button: {
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  evalResultBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  evalFeedback: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  congratsEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  congratsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
