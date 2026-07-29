import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, StatusBar, KeyboardAvoidingView, Platform,
  Vibration, Modal,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../config/theme';
import { getCategoryEmoji } from '../utils/helpers';
import apiService from '../services/api';

const CATEGORIES = [
  { key: 'power', label: 'Power', emoji: '⚡' },
  { key: 'water', label: 'Water', emoji: '💧' },
  { key: 'event', label: 'Event', emoji: '🎉' },
  { key: 'lost', label: 'Lost & Found', emoji: '🔍' },
  { key: 'jobs', label: 'Jobs', emoji: '💼' },
  { key: 'emergency', label: 'Emergency', emoji: '🚨' },
  { key: 'general', label: 'General', emoji: '📋' },
];

const URGENCY_LEVELS = [
  { key: 'normal', label: 'Normal', color: Colors.normal, desc: 'Standard priority' },
  { key: 'important', label: 'Important', color: Colors.important, desc: 'Highlighted notice' },
  { key: 'urgent', label: 'Urgent', color: Colors.urgent, desc: 'Top priority alert' },
];

const EXPIRY_OPTIONS = [
  { days: 1, label: '1 Day' },
  { days: 3, label: '3 Days' },
  { days: 7, label: '1 Week' },
  { days: 14, label: '2 Weeks' },
];

export default function PostScreen({ user }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [category, setCategory] = useState('power');
  const [urgency, setUrgency] = useState('normal');
  const [expiryDays, setExpiryDays] = useState(3);
  const [publishing, setPublishing] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState(null);
  const soundRef = useRef(null);

  const stopEmergencySound = async () => {
    Vibration.cancel();
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (e) {}
    }
  };

  const playEmergencySound = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      if (soundRef.current) {
        try { await soundRef.current.unloadAsync(); } catch (e) {}
      }

      // Play emergency alarm audio offline from local asset for 5 seconds
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/alert.wav'),
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );

      soundRef.current = sound;

      // Automatically stop sound and vibration after 5 seconds (5000 ms)
      setTimeout(async () => {
        await stopEmergencySound();
      }, 5000);
    } catch (err) {
      console.log('Audio alert error:', err);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !description.trim() || !contact.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    const phoneNumber = contact.replace(/\D/g, '');
    if (phoneNumber.length !== 10) {
      Alert.alert('Invalid Contact', 'Please enter a valid 10-digit phone number.');
      return;
    }

    setPublishing(true);
    const result = await apiService.createNotice({
      title: title.trim(),
      description: description.trim(),
      contact: contact.trim(),
      category,
      urgency,
      author: user?.name || 'Resident',
      expiryDays,
      area: user?.colony || 'Anna Nagar Colony',
    });

    setPublishing(false);

    if (result) {
      // Trigger notification popup, 5-second audio alarm, and 5-second device vibration
      setNotificationData({ title: title.trim(), urgency });
      setShowNotification(true);

      if (urgency === 'urgent') {
        // Play emergency audio beep sound for 5 seconds + haptics + 5-second vibration motor
        playEmergencySound();
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (e) {}
        Vibration.cancel();
        Vibration.vibrate(5000); // 5000ms = 5 Seconds Vibration
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
        Vibration.cancel();
        Vibration.vibrate(500);
      }

      setStep(5); // Success
      // Reset form
      setTitle('');
      setDescription('');
      setContact('');
      setCategory('power');
      setUrgency('normal');
      setExpiryDays(3);
    } else {
      Alert.alert('Error', 'Failed to post notice. Check your server connection.');
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>📋 Select Category</Text>
      <Text style={styles.stepSubtitle}>Choose the type of notice</Text>

      <View style={styles.categoryGrid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryCard, category === cat.key && styles.categoryCardActive]}
            onPress={() => setCategory(cat.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text
              style={[
                styles.categoryLabel,
                category === cat.key && styles.categoryLabelActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
        <Text style={styles.nextBtnText}>Continue →</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>✍️ Notice Details</Text>
        <Text style={styles.stepSubtitle}>Describe the notice</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Power cut scheduled tomorrow"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide full details about the notice..."
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit phone number"
            placeholderTextColor={Colors.textMuted}
            value={contact}
            onChangeText={setContact}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextBtn, (!title.trim() || !description.trim()) && styles.btnDisabled]}
            onPress={() => setStep(3)}
            disabled={!title.trim() || !description.trim()}
          >
            <Text style={styles.nextBtnText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>⚠️ Urgency Level</Text>
      <Text style={styles.stepSubtitle}>How urgent is this notice?</Text>

      {URGENCY_LEVELS.map((urg) => (
        <TouchableOpacity
          key={urg.key}
          style={[
            styles.urgencyCard,
            urgency === urg.key && { borderColor: urg.color, backgroundColor: `${urg.color}15` },
          ]}
          onPress={() => setUrgency(urg.key)}
          activeOpacity={0.7}
        >
          <View style={[styles.urgencyDot, { backgroundColor: urg.color }]} />
          <View style={styles.urgencyInfo}>
            <Text
              style={[
                styles.urgencyLabel,
                urgency === urg.key && { color: urg.color },
              ]}
            >
              {urg.label}
            </Text>
            <Text style={styles.urgencyDesc}>{urg.desc}</Text>
          </View>
          {urgency === urg.key && <Text style={{ color: urg.color }}>✓</Text>}
        </TouchableOpacity>
      ))}

      <Text style={[styles.stepTitle, { marginTop: Spacing.xxl }]}>⏳ Expiry Duration</Text>
      <View style={styles.expiryRow}>
        {EXPIRY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.days}
            style={[styles.expiryChip, expiryDays === opt.days && styles.expiryChipActive]}
            onPress={() => setExpiryDays(opt.days)}
          >
            <Text
              style={[
                styles.expiryChipText,
                expiryDays === opt.days && styles.expiryChipTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(4)}>
          <Text style={styles.nextBtnText}>Preview →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4 = () => {
    const catColors = Colors[category] || Colors.general;
    const urgColor = URGENCY_LEVELS.find((u) => u.key === urgency)?.color || Colors.textMuted;
    const expLabel = EXPIRY_OPTIONS.find((e) => e.days === expiryDays)?.label || '3 Days';

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>👁️ Preview Notice</Text>
        <Text style={styles.stepSubtitle}>Review before publishing</Text>

        <View style={styles.previewCard}>
          <View style={[styles.previewStrip, { backgroundColor: urgColor }]} />
          <View style={styles.previewContent}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>{title}</Text>
              <View style={[styles.previewBadge, { backgroundColor: catColors.bg }]}>
                <Text style={[styles.previewBadgeText, { color: catColors.text }]}>
                  {getCategoryEmoji(category)} {category.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.previewDesc}>{description}</Text>
            <View style={styles.previewMeta}>
              <Text style={styles.previewMetaText}>👤 {user?.name || 'Resident'}</Text>
              <Text style={styles.previewMetaText}>📞 {contact}</Text>
              <Text style={styles.previewMetaText}>⏳ {expLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(3)}>
            <Text style={styles.backBtnText}>← Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.publishBtn, publishing && styles.btnDisabled]}
            onPress={handlePublish}
            disabled={publishing}
            activeOpacity={0.8}
          >
            <Text style={styles.publishBtnText}>
              {publishing ? 'Publishing...' : '🚀 Publish Notice'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStep5 = () => (
    <View style={styles.successContent}>
      <View style={styles.successIcon}>
        <Text style={{ fontSize: 48 }}>✅</Text>
      </View>
      <Text style={styles.successTitle}>Notice Published!</Text>
      <Text style={styles.successSubtitle}>
        Your notice is now live on the community board
      </Text>
      <TouchableOpacity
        style={styles.nextBtn}
        onPress={() => setStep(1)}
        activeOpacity={0.8}
      >
        <Text style={styles.nextBtnText}>Post Another Notice</Text>
      </TouchableOpacity>
    </View>
  );

  // Step indicator
  const renderStepIndicator = () => {
    if (step === 5) return null;
    return (
      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4].map((s) => (
          <View
            key={s}
            style={[
              styles.stepDot,
              s === step && styles.stepDotActive,
              s < step && styles.stepDotCompleted,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgDark} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✍️ Post Notice</Text>
        {renderStepIndicator()}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </ScrollView>

      {/* Custom Popup Notification */}
      <Modal
        visible={showNotification}
        transparent={true}
        animationType="slide"
        onRequestClose={() => { stopEmergencySound(); setShowNotification(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            notificationData?.urgency === 'urgent' && styles.modalContentUrgent
          ]}>
            <Text style={[
              styles.modalTitle,
              notificationData?.urgency === 'urgent' && { color: '#ff4d4d' }
            ]}>
              {notificationData?.urgency === 'urgent' ? '🚨 URGENT NOTICE POSTED!' : '📢 Notice Posted Successfully'}
            </Text>
            <Text style={[
              styles.modalMessage,
              notificationData?.urgency === 'urgent' && { color: '#ffcccc' }
            ]}>
              Your notice "{notificationData?.title}" is now visible to all members of the colony.
            </Text>
            <TouchableOpacity
              style={[
                styles.modalBtn,
                notificationData?.urgency === 'urgent' ? styles.modalBtnUrgent : styles.modalBtnSuccess
              ]}
              onPress={() => { stopEmergencySound(); setShowNotification(false); }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnText}>Acknowledge</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  stepContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  stepTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  stepDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    width: 60,
  },
  stepDotCompleted: {
    backgroundColor: Colors.success,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  categoryCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    width: '30%',
    flexGrow: 1,
  },
  categoryCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaded,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  categoryLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: Colors.primaryLight,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  urgencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  urgencyDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  urgencyInfo: {
    flex: 1,
  },
  urgencyLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  urgencyDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  expiryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  expiryChip: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  expiryChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaded,
  },
  expiryChipText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  expiryChipTextActive: {
    color: Colors.primaryLight,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  backBtn: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  nextBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  publishBtn: {
    flex: 2,
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
  },
  publishBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  previewCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: Spacing.xxl,
    ...Shadow.card,
  },
  previewStrip: {
    height: 5,
  },
  previewContent: {
    padding: Spacing.xl,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  previewTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  previewBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  previewBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  previewDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  previewMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  previewMetaText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  successContent: {
    alignItems: 'center',
    paddingTop: Spacing.huge * 2,
    paddingHorizontal: Spacing.xl,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.normalBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  successTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.bgCard,
    borderWidth: 2,
    borderColor: Colors.success,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  modalContentUrgent: {
    borderColor: Colors.urgent,
    backgroundColor: '#2d080c', // Dark red background
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  modalMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  modalBtn: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    minWidth: 160,
    alignItems: 'center',
  },
  modalBtnSuccess: {
    backgroundColor: Colors.success,
  },
  modalBtnUrgent: {
    backgroundColor: Colors.urgent,
  },
  modalBtnText: {
    color: '#ffffff',
    fontSize: FontSize.md,
    fontWeight: '800',
  },
});
