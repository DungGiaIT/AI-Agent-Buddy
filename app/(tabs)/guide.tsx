import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function GuideScreen() {
  const colors = useTheme();

  const faqs = [
    {
      q: "Tại sao tôi cần nộp bài bằng phương pháp Feynman?",
      a: "Phương pháp Feynman yêu cầu bạn phải giải thích một khái niệm phức tạp bằng ngôn từ đơn giản nhất. Nếu bạn không thể giải thích đơn giản, nghĩa là bạn chưa thực sự hiểu nó. AI sẽ đóng vai trò người nghe và chấm điểm sự hiểu biết của bạn."
    },
    {
      q: "Làm sao để giữ được Chuỗi (Streak)?",
      a: "Bạn cần hoàn thành ít nhất 1 bài học (bao gồm 30 phút tập trung và nộp bài Feynman) mỗi ngày. Nếu bỏ lỡ một ngày, chuỗi kỷ luật của bạn sẽ bị reset về 0."
    },
    {
      q: "Làm sao để đổi mục tiêu học tập khác?",
      a: "Hãy vào tab Roadmap, bấm nút 'Tạo lại lộ trình' để yêu cầu AI lên một kế hoạch học tập 7 ngày mới cho bạn."
    }
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={[styles.headerTitle, { color: colors.text }]}>
            Hướng Dẫn Sử Dụng 📚
          </ThemedText>
          
          <ThemedText type="small" style={{ color: colors.textSecondary, marginBottom: 20 }}>
            Chào mừng bạn đến với AI Study Buddy. Dưới đây là cách ứng dụng giúp bạn vượt qua sự trì hoãn và học tập hiệu quả.
          </ThemedText>

          {/* Section 1: Workflow */}
          <ThemedView style={[styles.card, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
            <ThemedText type="subtitle" style={[styles.cardTitle, { color: colors.primary }]}>
              Quy trình 3 bước mỗi ngày
            </ThemedText>
            
            <View style={styles.stepRow}>
              <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
                <ThemedText type="smallBold" style={{ color: '#fff' }}>1</ThemedText>
              </View>
              <View style={styles.stepTextContainer}>
                <ThemedText type="defaultBold" style={{ color: colors.text }}>Nhận Nhiệm Vụ</ThemedText>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>Kiểm tra lộ trình ở tab Home để xem mục tiêu hôm nay là gì.</ThemedText>
              </View>
            </View>
            
            <View style={styles.stepRow}>
              <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
                <ThemedText type="smallBold" style={{ color: '#fff' }}>2</ThemedText>
              </View>
              <View style={styles.stepTextContainer}>
                <ThemedText type="defaultBold" style={{ color: colors.text }}>Tập Trung 30 Phút</ThemedText>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>Bấm Bắt đầu để đồng hồ đếm ngược chạy. Hãy tập trung cao độ.</ThemedText>
              </View>
            </View>

            <View style={styles.stepRow}>
              <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
                <ThemedText type="smallBold" style={{ color: '#fff' }}>3</ThemedText>
              </View>
              <View style={styles.stepTextContainer}>
                <ThemedText type="defaultBold" style={{ color: colors.text }}>Nộp Bài Feynman</ThemedText>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>Viết tóm tắt lại những gì đã học. AI sẽ chấm điểm và xác nhận bạn hoàn thành ngày học.</ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* Section 2: FAQ */}
          <ThemedText type="subtitle" style={[styles.headerTitle, { color: colors.text, marginTop: 10 }]}>
            Câu hỏi thường gặp
          </ThemedText>

          {faqs.map((faq, index) => (
            <ThemedView key={index} style={[styles.faqCard, { borderColor: colors.border }]}>
              <ThemedText type="defaultBold" style={{ color: colors.text, marginBottom: 6 }}>
                Q: {faq.q}
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary, lineHeight: 20 }}>
                A: {faq.a}
              </ThemedText>
            </ThemedView>
          ))}
          
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
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepTextContainer: {
    flex: 1,
  },
  faqCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'transparent',
  }
});
