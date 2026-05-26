import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Pressable, ScrollView, View, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { getRoadmap, saveRoadmap, getSettings, saveSettings, generateRoadmapFromAI, DayTask } from '@/services/study-store';

export default function RoadmapScreen() {
  const colors = useTheme();

  const [roadmap, setRoadmap] = useState<DayTask[]>([]);
  const [goal, setGoal] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const storedRoadmap = await getRoadmap();
      setRoadmap(storedRoadmap);
      
      const config = await getSettings();
      setApiKey(config.apiKey);
      setGoal(config.goal);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!goal.trim()) {
      Alert.alert('Nhắc nhở', 'Vui lòng nhập mục tiêu học tập của bạn.');
      return;
    }

    if (!apiKey.trim()) {
      Alert.alert(
        'Thiếu API Key 🔑',
        'Vui lòng cấu hình Gemini API Key trước để sử dụng tính năng tạo lộ trình bằng AI. Bạn có muốn chuyển sang màn hình Cài đặt ngay không?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đến Cài đặt', onPress: () => router.push('/settings' as any) }
        ]
      );
      return;
    }

    setIsGenerating(true);
    try {
      // 1. Generate via AI
      const generated = await generateRoadmapFromAI(goal, apiKey);
      
      // 2. Save settings and roadmap
      const config = await getSettings();
      config.goal = goal;
      await saveSettings(config);
      await saveRoadmap(generated);
      
      setRoadmap(generated);
      setExpandedDay(1); // Expand day 1 by default
      Alert.alert('Hoàn thành', 'AI đã tự động thiết kế lộ trình 7 ngày tối ưu cho bạn! 🎉');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Lỗi tạo lộ trình', e?.message || 'Đã có lỗi xảy ra. Hãy kiểm tra lại API Key hoặc kết nối mạng.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleExpand = (day: number) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  // Determine current active day (first uncompleted day)
  const activeDay = roadmap.find(t => !t.done)?.day || (roadmap.length > 0 ? roadmap[roadmap.length - 1].day : 1);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.header}>
            <ThemedText type="subtitle" style={[styles.title, { color: colors.primary }]}>
              Lộ Trình Học 7 Ngày 📅
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              AI chia nhỏ bài học thành các phần dưới 30 phút để giảm trì hoãn
            </ThemedText>
          </ThemedView>

          {/* Empty State: Create Goal */}
          {roadmap.length === 0 ? (
            <ThemedView style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
              <ThemedText type="default" style={styles.emoji}>🌱</ThemedText>
              <ThemedText type="smallBold" style={{ textAlign: 'center', fontSize: 18 }}>
                Chưa có lộ trình học tập nào được kích hoạt
              </ThemedText>
              <ThemedText type="small" style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Hãy nhập mục tiêu học tập (ví dụ: "Học SQL cơ bản", "Ôn thi môn Lịch sử đảng") và để AI tự động lên lịch trình cho bạn.
              </ThemedText>
              
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                placeholder="Nhập mục tiêu học của bạn..."
                placeholderTextColor={colors.textSecondary}
                value={goal}
                onChangeText={setGoal}
              />

              <Pressable
                onPress={handleGenerateRoadmap}
                disabled={isGenerating}
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 },
                ]}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <ThemedText type="default" style={styles.buttonText}>
                    Thiết kế lộ trình bằng AI ✨
                  </ThemedText>
                )}
              </Pressable>
            </ThemedView>
          ) : (
            // Active State: Display 7-day timeline
            <View style={styles.timelineContainer}>
              <ThemedView style={[styles.goalHeaderCard, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
                <ThemedText type="smallBold" style={{ color: colors.textSecondary, letterSpacing: 0.5, fontSize: 11 }}>
                  MỤC TIÊU HIỆN TẠI
                </ThemedText>
                <ThemedText type="default" style={[styles.goalText, { color: colors.accent }]}>
                  🎯 {goal}
                </ThemedText>
              </ThemedView>

              <View style={styles.timelineList}>
                {roadmap.map((item) => {
                  const isExpanded = expandedDay === item.day;
                  const isActive = item.day === activeDay;
                  const isDone = item.done;

                  return (
                    <View key={item.day} style={styles.timelineItem}>
                      {/* Left timeline nodes */}
                      <View style={styles.leftNodeContainer}>
                        <View
                          style={[
                            styles.nodeCircle,
                            isDone && { backgroundColor: colors.primary, borderColor: colors.primary },
                            isActive && !isDone && { backgroundColor: colors.backgroundElement, borderColor: colors.primary, borderWidth: 3 },
                            !isDone && !isActive && { backgroundColor: '#F8FAFC', borderColor: colors.border, borderWidth: 2 },
                          ]}
                        >
                          {isDone ? (
                            <ThemedText type="smallBold" style={{ color: '#ffffff', fontSize: 10 }}>✓</ThemedText>
                          ) : (
                            <ThemedText
                              type="smallBold"
                              style={[
                                { fontSize: 10 },
                                isActive ? { color: colors.primary } : { color: colors.textSecondary },
                              ]}
                            >
                              {item.day}
                            </ThemedText>
                          )}
                        </View>
                        {item.day < 7 && <View style={[styles.nodeLine, { backgroundColor: colors.border }]} />}
                      </View>

                      {/* Right cards */}
                      <Pressable
                        onPress={() => toggleExpand(item.day)}
                        style={[
                          styles.cardPressable,
                          { borderColor: colors.border, backgroundColor: colors.backgroundElement },
                          isActive && { borderWidth: 2, borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.08, shadowRadius: 8 },
                          isDone && { opacity: 0.8 },
                        ]}
                      >
                        <ThemedView style={styles.cardHeader}>
                          <View style={styles.cardHeaderLeft}>
                            <ThemedText
                              type="smallBold"
                              style={[
                                styles.dayBadge,
                                { color: '#ffffff' },
                                isDone ? { backgroundColor: colors.primary } : { backgroundColor: colors.textSecondary },
                                isActive && !isDone && { backgroundColor: colors.primary },
                              ]}
                            >
                              Ngày {item.day}
                            </ThemedText>
                            <ThemedText
                              type="smallBold"
                              style={[
                                styles.cardTitleText,
                                { color: colors.text },
                                isDone && { textDecorationLine: 'line-through' },
                              ]}
                              numberOfLines={1}
                            >
                              {item.title}
                            </ThemedText>
                          </View>
                          <ThemedText type="small" style={{ color: colors.textSecondary, fontSize: 12 }}>
                            {isExpanded ? '▲' : '▼'}
                          </ThemedText>
                        </ThemedView>

                        {/* Collapsible content */}
                        {isExpanded && (
                          <View style={styles.expandedContent}>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            
                            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent }]}>
                              📝 Nhiệm vụ cần làm (30 phút):
                            </ThemedText>
                            {item.subtasks.map((sub, sIdx) => (
                              <View key={sIdx} style={styles.subtaskRow}>
                                <ThemedText type="small" style={{ color: colors.primary, marginRight: 6 }}>•</ThemedText>
                                <ThemedText type="small" style={[styles.subtaskText, { color: colors.text }]}>
                                  {sub}
                                </ThemedText>
                              </View>
                            ))}

                            <ThemedText type="smallBold" style={[styles.sectionTitle, { color: colors.accent, marginTop: 12 }]}>
                              💡 Khái niệm Feynman cần tóm tắt:
                            </ThemedText>
                            <ThemedView type="backgroundSelected" style={styles.conceptBox}>
                              <ThemedText type="small" style={{ color: colors.text }}>
                                {item.concept}
                              </ThemedText>
                            </ThemedView>

                            {isDone && item.feynmanScore !== undefined && (
                              <View style={styles.feedbackSection}>
                                <ThemedText type="smallBold" style={{ color: colors.primary }}>
                                  ✓ Chấm điểm Feynman: {item.feynmanScore}/10
                                </ThemedText>
                                {item.feynmanFeedback && (
                                  <ThemedText type="small" style={[styles.feedbackText, { color: colors.textSecondary }]}>
                                    AI: "{item.feynmanFeedback}"
                                  </ThemedText>
                                )}
                              </View>
                            )}
                          </View>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>

              {/* Regerenate button */}
              <Pressable
                onPress={() => {
                  Alert.alert(
                    'Đổi lộ trình học',
                    'Bạn có muốn thiết kế lộ trình mới không? Lộ trình cũ và kết quả học tập hiện tại sẽ bị xóa.',
                    [
                      { text: 'Hủy', style: 'cancel' },
                      { text: 'Đồng ý', onPress: () => setRoadmap([]) }
                    ]
                  );
                }}
                style={({ pressed }) => [
                  styles.buttonSecondary,
                  { borderColor: colors.primary },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <ThemedText type="smallBold" style={{ color: colors.primary }}>
                  🔄 Đổi mục tiêu & Tạo lại lộ trình
                </ThemedText>
              </Pressable>
            </View>
          )}
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
  header: {
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'transparent',
  },
  emoji: {
    fontSize: 48,
    marginVertical: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
    alignSelf: 'stretch',
  },
  button: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
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
  timelineContainer: {
    gap: 16,
  },
  goalHeaderCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'transparent',
  },
  goalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  timelineList: {
    position: 'relative',
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  leftNodeContainer: {
    width: 36,
    alignItems: 'center',
    marginRight: 12,
  },
  nodeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  nodeLine: {
    position: 'absolute',
    top: 24,
    bottom: -16,
    width: 2,
    zIndex: 1,
  },
  cardPressable: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    backgroundColor: 'transparent',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dayBadge: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardTitleText: {
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  subtaskText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  conceptBox: {
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  feedbackSection: {
    marginTop: 12,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  feedbackText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  buttonSecondary: {
    height: 48,
    borderWidth: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
});
