import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { getSettings, saveSettings, clearAllData } from '@/services/study-store';

export default function SettingsScreen() {
  const colors = useTheme();
  
  const [goal, setGoal] = useState('');
  const [studyTime, setStudyTime] = useState('20:00');
  const [tone, setTone] = useState<'friendly' | 'strict' | 'funny'>('friendly');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const config = await getSettings();
      setGoal(config.goal);
      setStudyTime(config.studyTime || '20:00');
      setTone(config.tone || 'friendly');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings({ apiKey: '', goal, studyTime, tone });
      Alert.alert('Thành công', 'Đã lưu cấu hình trợ lý AI Study Buddy!');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu cấu hình.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa toàn bộ dữ liệu, lộ trình học và chuỗi Streak hiện tại không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            setGoal('');
            setStudyTime('20:00');
            setTone('friendly');
            Alert.alert('Đã xóa', 'Toàn bộ dữ liệu đã được làm sạch.');
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.header}>
            <ThemedText type="subtitle" style={[styles.title, { color: colors.primary }]}>
              Cấu Hình Trợ Lý ⚙️
            </ThemedText>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Thiết lập API key và lộ trình học tập diệt trì hoãn của bạn
            </ThemedText>
          </ThemedView>

          {/* Target Goal Setup */}
          <ThemedView style={[styles.card, { borderColor: colors.border }]}>
            <ThemedText type="smallBold" style={[styles.cardTitle, { color: colors.accent }]}>
              🎯 MỤC TIÊU HỌC TẬP CHÍNH
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder="Ví dụ: Học lập trình React Native cơ bản..."
              placeholderTextColor={colors.textSecondary}
              value={goal}
              onChangeText={setGoal}
            />
            <ThemedText type="small" style={[styles.hint, { color: colors.textSecondary }]}>
              Mục tiêu lớn này sẽ được AI phân tách thành lộ trình học 7 ngày siêu nhỏ (dưới 30 phút mỗi ngày).
            </ThemedText>
          </ThemedView>

          {/* Time & Alert Tone Setup */}
          <View style={styles.row}>
            <ThemedView style={[styles.card, styles.flexHalf, { borderColor: colors.border }]}>
              <ThemedText type="smallBold" style={[styles.cardTitle, { color: colors.accent }]}>
                ⏱️ GIỜ HỌC CỐ ĐỊNH
              </ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, textAlign: 'center', backgroundColor: colors.background }]}
                placeholder="HH:MM"
                placeholderTextColor={colors.textSecondary}
                value={studyTime}
                onChangeText={setStudyTime}
              />
              <ThemedText type="small" style={[styles.hint, { color: colors.textSecondary }]}>
                Ứng dụng sẽ gửi cảnh báo đẩy nếu bạn chưa học.
              </ThemedText>
            </ThemedView>

            <ThemedView style={[styles.card, styles.flexHalf, { borderColor: colors.border }]}>
              <ThemedText type="smallBold" style={[styles.cardTitle, { color: colors.accent }]}>
                🗣️ GIỌNG ĐIỆU AI
              </ThemedText>
              <View style={styles.toneContainer}>
                {(['friendly', 'strict', 'funny'] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setTone(t)}
                    style={[
                      styles.toneButton,
                      { borderColor: colors.border },
                      tone === t && { backgroundColor: colors.primary },
                    ]}
                  >
                    <ThemedText
                      type="smallBold"
                      style={[
                        { fontSize: 12 },
                        tone === t ? { color: '#ffffff' } : { color: colors.text },
                      ]}
                    >
                      {t === 'friendly' ? 'Nhẹ Nhàng' : t === 'strict' ? 'Quát Mắng' : 'Hài Hước'}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </ThemedView>
          </View>

          {/* Action Buttons */}
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.8 },
            ]}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText type="default" style={styles.buttonText}>
                Lưu cấu hình & Kích hoạt 🚀
              </ThemedText>
            )}
          </Pressable>

          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [
              styles.buttonSecondary,
              { borderColor: '#EF4444' },
              pressed && { opacity: 0.8 },
            ]}
          >
            <ThemedText type="smallBold" style={{ color: '#EF4444' }}>
              Xóa toàn bộ dữ liệu ❌
            </ThemedText>
          </Pressable>
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
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    letterSpacing: 1,
    fontSize: 13,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flexHalf: {
    flex: 1,
  },
  toneContainer: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 4,
  },
  toneButton: {
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
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
  buttonSecondary: {
    height: 48,
    borderWidth: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
});
