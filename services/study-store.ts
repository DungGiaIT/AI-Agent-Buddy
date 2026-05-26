import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure notification behavior for Native
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export interface DayTask {
  day: number;
  title: string;
  subtasks: string[];
  concept: string;
  done: boolean;
  feynmanSummary?: string;
  feynmanScore?: number;
  feynmanFeedback?: string;
}

export interface AppSettings {
  apiKey: string;
  studyTime: string; // e.g. "20:00"
  tone: 'friendly' | 'strict' | 'funny';
  goal: string;
}

const isWeb = Platform.OS === 'web';

const Keys = {
  API_KEY: 'AI_STUDY_BUDDY_API_KEY',
  SETTINGS: 'AI_STUDY_BUDDY_SETTINGS',
  ROADMAP: 'AI_STUDY_BUDDY_ROADMAP',
  STREAK: 'AI_STUDY_BUDDY_STREAK',
  LAST_COMPLETED: 'AI_STUDY_BUDDY_LAST_COMPLETED',
};

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isWeb) {
      return localStorage.getItem(key);
    }
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isWeb) {
      localStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (isWeb) {
      localStorage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

export async function getApiKey(): Promise<string> {
  return (await storage.getItem(Keys.API_KEY)) || '';
}

export async function saveApiKey(key: string): Promise<void> {
  await storage.setItem(Keys.API_KEY, key);
}

export async function getSettings(): Promise<AppSettings> {
  const data = await storage.getItem(Keys.SETTINGS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {}
  }
  return {
    apiKey: '',
    studyTime: '20:00',
    tone: 'friendly',
    goal: '',
  };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await storage.setItem(Keys.SETTINGS, JSON.stringify(settings));
  await saveApiKey(settings.apiKey);
  
  // Parse hours and minutes and schedule notifications
  if (settings.studyTime) {
    const [hourStr, minStr] = settings.studyTime.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);
    if (!isNaN(hour) && !isNaN(minute)) {
      await scheduleDailyReminder(hour, minute, settings.tone);
    }
  }
}

export async function getRoadmap(): Promise<DayTask[]> {
  const data = await storage.getItem(Keys.ROADMAP);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {}
  }
  return [];
}

export async function saveRoadmap(roadmap: DayTask[]): Promise<void> {
  await storage.setItem(Keys.ROADMAP, JSON.stringify(roadmap));
}

export async function getStreak(): Promise<number> {
  const data = await storage.getItem(Keys.STREAK);
  return data ? parseInt(data, 10) : 0;
}

export async function saveStreak(streak: number): Promise<void> {
  await storage.setItem(Keys.STREAK, streak.toString());
}

export async function getLastCompletedDate(): Promise<string> {
  return (await storage.getItem(Keys.LAST_COMPLETED)) || '';
}

export async function saveLastCompletedDate(dateStr: string): Promise<void> {
  await storage.setItem(Keys.LAST_COMPLETED, dateStr);
}

// Check and potentially reset or maintain Streak based on dates
export async function checkAndUpdateStreak(isCompleting: boolean): Promise<number> {
  const currentStreak = await getStreak();
  const lastDateStr = await getLastCompletedDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  if (isCompleting) {
    if (lastDateStr === todayStr) {
      // Already completed today, no change
      return currentStreak;
    }
    
    // Check if yesterday was completed to increment, or reset
    let newStreak = 1;
    if (lastDateStr) {
      const lastDate = new Date(lastDateStr);
      const today = new Date(todayStr);
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        newStreak = currentStreak + 1;
      }
    } else {
      newStreak = 1;
    }
    
    await saveStreak(newStreak);
    await saveLastCompletedDate(todayStr);
    return newStreak;
  } else {
    // Regular check on app open: if yesterday and today are both uncompleted, streak goes to 0
    if (lastDateStr) {
      const lastDate = new Date(lastDateStr);
      const today = new Date(todayStr);
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        // Streak broken!
        await saveStreak(0);
        return 0;
      }
    }
    return currentStreak;
  }
}

export async function clearAllData(): Promise<void> {
  await storage.removeItem(Keys.ROADMAP);
  await storage.removeItem(Keys.SETTINGS);
  await storage.removeItem(Keys.STREAK);
  await storage.removeItem(Keys.LAST_COMPLETED);
}

// Notification schedules
export async function requestNotificationPermission() {
  if (isWeb) return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (e) {
    return false;
  }
}

async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('channel_friendly', {
      name: 'Friendly Reminder',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'friendly.wav',
    });
    await Notifications.setNotificationChannelAsync('channel_strict', {
      name: 'Strict Reminder',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'strict.wav',
    });
    await Notifications.setNotificationChannelAsync('channel_funny', {
      name: 'Funny Reminder',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'funny.wav',
    });
  }
}

export async function scheduleDailyReminder(hour: number, minute: number, tone: 'friendly' | 'strict' | 'funny') {
  if (isWeb) return;
  try {
    const permitted = await requestNotificationPermission();
    if (!permitted) return;

    await setupNotificationChannels();
    await Notifications.cancelAllScheduledNotificationsAsync();

    const currentStreak = await getStreak();
    const streakMsg = currentStreak > 0 ? ` Bạn đang có chuỗi kỷ luật ${currentStreak} ngày, đừng để bị đứt đoạn nhé!` : ` Bắt đầu xây dựng chuỗi kỷ luật ngay hôm nay!`;

    let body = `Đã đến giờ học rồi! Mở app ra và hoàn thành nhiệm vụ hôm nay thôi nào! 🔥${streakMsg}`;
    let channelId = 'channel_friendly';
    let soundFile = 'friendly.wav';

    if (tone === 'strict') {
      body = `Deadline học bài đến rồi! Đừng trì hoãn nữa, mở app và học ngay nếu không muốn mất chuỗi ${currentStreak} ngày! 😡`;
      channelId = 'channel_strict';
      soundFile = 'strict.wav';
    } else if (tone === 'funny') {
      body = `Alo alo! Học nhanh lên không cái điện thoại nó thông minh hơn bạn mất! Mở app để giữ chuỗi ${currentStreak} ngày nào! 😜`;
      channelId = 'channel_funny';
      soundFile = 'funny.wav';
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎓 AI Study Buddy Cảnh Báo!",
        body: body,
        sound: soundFile,
        data: { url: '/' }, // Deep Link đến màn hình Home (để nộp bài)
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hour,
        minute: minute,
        channelId: channelId,
      } as any,
    });
  } catch (e) {
    console.error('Failed to schedule notification:', e);
  }
}

// Client-side Gemini API Services
export async function generateRoadmapFromAI(goal: string, apiKey: string): Promise<DayTask[]> {
  // Gọi qua Vercel Proxy để bảo mật API Key (Hardcode để tránh lỗi cache .env)
  const url = 'https://ai-agent-buddy.vercel.app/api/gemini';

  const prompt = `You are an elite AI Study Buddy coach who specializes in helping students beat procrastination.
The user wants to achieve this learning goal in 7 days: "${goal}".
Break down this goal into a structured 7-day roadmap.
Each day's task MUST take NO MORE THAN 30 MINUTES to complete (micro-learning structure).
Return ONLY a valid JSON array, without any markdown formatting, backticks, or other text. The JSON array must conform to this TypeScript array type:
interface DayTask {
  day: number;
  title: string;
  subtasks: string[]; // 2-3 specific actions to complete
  concept: string; // The core concept/key idea to be summarized using the Feynman technique at the end of the day
  done: boolean;
}

Example output structure:
[
  {
    "day": 1,
    "title": "Hiểu khái niệm cơ bản về biến",
    "subtasks": ["Xem video 10 phút về biến", "Viết 3 dòng code khai báo biến số và chuỗi"],
    "concept": "Tác dụng của biến và sự khác nhau giữa hằng số và biến số",
    "done": false
  }
]`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Không nhận được phản hồi hợp lệ từ Gemini API.');
  }

  const parsed = JSON.parse(text.trim());
  if (Array.isArray(parsed)) {
    return parsed.map((item: any, index: number) => ({
      day: item.day || index + 1,
      title: item.title || 'Nhiệm vụ học tập',
      subtasks: item.subtasks || [],
      concept: item.concept || 'Khái niệm cốt lõi',
      done: false,
    }));
  }
  
  throw new Error('Dữ liệu trả về không đúng định dạng lộ trình.');
}

export async function evaluateFeynmanSummary(
  summary: string,
  taskTitle: string,
  concept: string,
  apiKey: string,
  tone: 'friendly' | 'strict' | 'funny'
): Promise<{ success: boolean; rating: number; feedback: string }> {
  // Gọi qua Vercel Proxy để bảo mật API Key (Hardcode để tránh lỗi cache .env)
  const url = 'https://ai-agent-buddy.vercel.app/api/gemini';

  const prompt = `You are a professional tutor. A student is trying to explain the core concept of "[concept]" as part of their study task: "[taskTitle]".
The student's Feynman explanation is: "${summary}".
Evaluate if this explanation is accurate and covers the essence of the concept.
Tone of voice for your feedback: ${tone} (choose from: "strict" - commanding, highly disciplined, slightly scolding if lazy, but motivating; "friendly" - warm, supportive, enthusiastic; "funny" - humorous, slightly sarcastic, engaging).
Return ONLY a valid JSON object with the following fields, with NO backticks or markdown:
{
  "success": boolean, // true if explanation is correct and demonstrates understanding (score >= 5), false otherwise
  "rating": number, // score from 1 to 10
  "feedback": string // detailed feedback tailored to the selected tone of voice in Vietnamese
}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Không nhận được đánh giá từ Gemini.');
  }

  return JSON.parse(text.trim());
}
